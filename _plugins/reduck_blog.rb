# frozen_string_literal: true

require "date"

# What a post needs beyond what markdown gives it: its address, the date a reader sees, the label
# of the topic it claims, and the opening lines the index shows when it leads.
#
# A post is a folder under `_articles/` holding `index.md` and the images beside it, with the front
# matter `conception-ai/reduck-blog-content` describes — so a post written for the app renders
# here unchanged.
module ReduckBlog
	# How long an opening can run before it is cut, in characters. The hero clamps it to three
	# lines; this only stops a long first paragraph reaching the index whole.
	EXCERPT_LIMIT = 320

	# Every cover is drawn at 16/9, the one shape the index, a card and the article all give it. A
	# file at any other ratio is cropped, and cropped differently in each of the three, so the post
	# looks like a different post depending on where it is seen. The build stops rather than
	# publish that.
	COVER_RATIO = 16.0 / 9.0

	# A share card is drawn at 1.91/1, the shape a large card is laid out at by Facebook, LinkedIn,
	# X and Slack alike. It is not the cover's 16/9, and the difference is why a post may name a
	# second picture: one file cannot be both without a reader cropping it.
	SHARE_RATIO = 1200.0 / 630.0

	# Enough room for a rounding to a whole pixel and nothing more: a shape a reader would notice
	# is a shape that fails.
	COVER_TOLERANCE = 0.005

	class Generator < Jekyll::Generator
		safe true
		priority :high

		def generate(site)
			collection = site.collections["articles"]
			return if collection.nil?

			labels = (site.data["categories"] || []).to_h { |c| [c["id"], c["label"]] }

			collection.docs.each do |doc|
				slug = File.basename(File.dirname(doc.relative_path))
				doc.data["slug"] = slug
				doc.data["permalink"] = "/#{slug}/"
				doc.data["category_label"] = labels[doc.data["category"]] || doc.data["category"]
				doc.data["published_on"] = readable(doc.data["publishedAt"])

				hero = doc.data["heroImage"]
				if hero
					doc.data["hero_url"] = asset_url(site, slug, hero)
					doc.data["hero_width"], doc.data["hero_height"] =
						check_ratio(doc, slug, hero, COVER_RATIO, "16/9")
				end

				# The picture a link to the post unfurls into. Where a post names none the cover
				# stands in, cropped a little by whoever lays the card out; a post that would
				# rather choose what is cropped names its own.
				share = doc.data["shareImage"]
				if share
					doc.data["share_url"] = asset_url(site, slug, share)
					doc.data["share_width"], doc.data["share_height"] =
						check_ratio(doc, slug, share, SHARE_RATIO, "1.91/1")
				end

				doc.data["excerpt_text"] = excerpt(doc)

				# A draft answers `noindex` and is absent from the index and the feed. Submitting
				# it in the sitemap at the same time asks a crawler to fetch a page it is then told
				# not to keep — `jekyll-sitemap` lists every document until one says otherwise.
				doc.data["sitemap"] = false if doc.data["draft"]

				# Nothing renders `content` on this site, but an `excerpt` Jekyll builds from a
				# post is what the feed falls back to, so the markdown stays where it is.
			end

			site.data["articles"] = listed(collection.docs)

			# The topics a reader can actually reach, in the order `_data/categories.yml` declares
			# them. A topic no published post claims is a filter that answers nothing, and a single
			# topic is a choice that is not one — the templates draw no topic row below two.
			claimed = site.data["articles"].map { |doc| doc.data["category"] }.uniq
			site.data["used_categories"] = (site.data["categories"] || []).select do |category|
				claimed.include?(category["id"])
			end
		end

		private

		# Newest first — the order the index renders, hero included. A draft is never listed,
		# though its own page still answers, so it can be shared for review by its URL.
		def listed(docs)
			docs.reject { |doc| doc.data["draft"] }
				.sort_by { |doc| doc.data["publishedAt"].to_s }
				.reverse
		end

		# Stops the build unless the picture is the shape it is named for, and answers its size so
		# the head can declare it. The message names the file and the height that would have been
		# right, so the fix needs no arithmetic from whoever reads it. A picture held elsewhere cannot be
		# measured here, so it passes unread and unsized.
		def check_ratio(doc, slug, file, wanted, label)
			return if file.start_with?("http")

			path = File.join(File.dirname(doc.path), file)
			unless File.file?(path)
				raise Jekyll::Errors::FatalException,
					"#{slug}: #{file.inspect} is not a file beside the post"
			end

			size = image_size(path)
			if size.nil?
				raise Jekyll::Errors::FatalException,
					"#{slug}: cannot read the size of #{file} — a picture must be PNG, JPEG or SVG"
			end

			width, height = size
			ratio = width.to_f / height
			return size if (ratio - wanted).abs <= COVER_TOLERANCE

			raise Jekyll::Errors::FatalException,
				"#{slug}: #{file} is #{width}x#{height} (#{format("%.3f", ratio)}), and it must be " \
				"#{label} (#{format("%.3f", wanted)}). At #{width} wide that is #{(width / wanted).round} high."
		end

		# The intrinsic size, read from the file's own header rather than by shelling out, so the
		# build needs nothing installed. nil when the format is not one of the three.
		def image_size(path)
			case File.extname(path).downcase
			when ".png" then png_size(path)
			when ".jpg", ".jpeg" then jpeg_size(path)
			when ".svg" then svg_size(path)
			end
		end

		def png_size(path)
			head = File.binread(path, 24)
			return nil unless head && head.byteslice(0, 8) == "\x89PNG\r\n\x1a\n".b

			head.byteslice(16, 8).unpack("N2")
		end

		# The size sits in a frame header, which follows any number of other segments, so the
		# segments are walked rather than guessed at.
		def jpeg_size(path)
			File.open(path, "rb") do |file|
				return nil unless file.read(2) == "\xFF\xD8".b

				loop do
					byte = file.read(1)
					return nil if byte.nil?
					next unless byte == "\xFF".b

					marker = file.read(1)
					return nil if marker.nil?

					code = marker.ord
					next if [0xD8, 0x01, 0xFF].include?(code) || (0xD0..0xD7).cover?(code)

					length = file.read(2)&.unpack1("n")
					return nil if length.nil?

					# A start-of-frame marker states the size. C4, C8 and CC share the range and
					# describe tables, not a frame.
					if (0xC0..0xCF).cover?(code) && ![0xC4, 0xC8, 0xCC].include?(code)
						frame = file.read(5)
						return nil if frame.nil? || frame.bytesize < 5

						height, width = frame.byteslice(1, 4).unpack("n2")
						return [width, height]
					end

					file.seek(length - 2, IO::SEEK_CUR)
				end
			end
		end

		# `viewBox` first: it is the drawing's own coordinate space, and it is what decides the
		# shape when width and height carry units or are absent.
		def svg_size(path)
			head = File.read(path, 2048)
			tag = head[/<svg\b[^>]*>/m]
			return nil if tag.nil?

			if (box = tag[/viewBox\s*=\s*["\']([^"\']+)["\']/m, 1])
				numbers = box.split(/[\s,]+/).map(&:to_f)
				return [numbers[2], numbers[3]] if numbers.length == 4 && numbers[2] > 0 && numbers[3] > 0
			end

			width = tag[/\bwidth\s*=\s*["\']([\d.]+)/m, 1]&.to_f
			height = tag[/\bheight\s*=\s*["\']([\d.]+)/m, 1]&.to_f
			return nil if width.nil? || height.nil? || width <= 0 || height <= 0

			[width, height]
		end

		# A file beside a post is named in front matter as a bare file name; the index and the head
		# read it from elsewhere and need the path. A URL or an absolute path is already one.
		def asset_url(site, slug, file)
			return file if file.start_with?("http", "/")

			"#{site.baseurl}/#{slug}/#{file}"
		end

		def readable(published_at)
			Date.parse(published_at.to_s).strftime("%-d %b %Y")
		rescue ArgumentError, TypeError
			published_at.to_s
		end

		# The opening lines, shown under the title when the post leads the index. A post may write
		# its own; where it does not, the first paragraph of the prose stands in.
		def excerpt(doc)
			written = doc.data["excerpt"]
			return written.to_s.strip unless written.nil? || written.to_s.strip.empty?

			first = doc.content
				.split(/\r?\n\r?\n/)
				.map(&:strip)
				.find { |para| readable_paragraph?(para) }
			return "" if first.nil?

			plain = first.gsub(/\[([^\]]*)\]\([^)]*\)/, '\1').gsub(/[*_`#>]/, "").gsub(/\s+/, " ").strip
			plain.length > EXCERPT_LIMIT ? "#{plain[0, EXCERPT_LIMIT].rstrip}…" : plain
		end

		# A heading, a fence, an image or a list says what the post is about only in passing; the
		# opening the index wants is the first run of ordinary prose.
		def readable_paragraph?(para)
			return false if para.empty?

			!para.start_with?("#", "```", "!", ">", "-", "*", "|", ":::", "::")
		end
	end
end

# Kramdown wraps a fence in `div.highlight` holding a `pre`: a frame that does not scroll around a
# box that does — the same two parts `CodeBlock.svelte` is built from. Wearing `code-block` here
# means the fence takes that component's chrome from `site.css` rather than a second copy of it
# written against `.prose pre`, and it is the frame, not the scrolling `pre`, that the copy button
# is positioned against.
Jekyll::Hooks.register :documents, :post_render do |doc|
	next unless doc.collection.label == "articles"

	doc.output = doc.output.gsub('<div class="highlight">', '<div class="highlight code-block">')
end
