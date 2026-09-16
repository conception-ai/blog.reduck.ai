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

	class Generator < Jekyll::Generator
		safe true
		priority :high

		def generate(site)
			collection = site.collections["articles"]
			return if collection.nil?

			labels = (site.config["categories"] || []).to_h { |c| [c["id"], c["label"]] }

			collection.docs.each do |doc|
				slug = File.basename(File.dirname(doc.relative_path))
				doc.data["slug"] = slug
				doc.data["permalink"] = "/#{slug}/"
				doc.data["category_label"] = labels[doc.data["category"]] || doc.data["category"]
				doc.data["published_on"] = readable(doc.data["publishedAt"])

				# A hero image is written beside the post that uses it, so its source is a bare
				# file name; the index and the head read it from elsewhere and need the path.
				hero = doc.data["heroImage"]
				doc.data["hero_url"] = hero_url(site, slug, hero) if hero

				doc.data["excerpt_text"] = excerpt(doc)

				# Nothing renders `content` on this site, but an `excerpt` Jekyll builds from a
				# post is what the feed falls back to, so the markdown stays where it is.
			end

			site.data["articles"] = listed(collection.docs)
		end

		private

		# Newest first — the order the index renders, hero included. A draft is never listed,
		# though its own page still answers, so it can be shared for review by its URL.
		def listed(docs)
			docs.reject { |doc| doc.data["draft"] }
				.sort_by { |doc| doc.data["publishedAt"].to_s }
				.reverse
		end

		def hero_url(site, slug, hero)
			return hero if hero.start_with?("http", "/")

			"#{site.baseurl}/#{slug}/#{hero}"
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
