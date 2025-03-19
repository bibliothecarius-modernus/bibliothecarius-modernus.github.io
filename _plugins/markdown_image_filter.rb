module Jekyll
    module MarkdownImageFilter
      def process_markdown_images(content)
        # Process regular markdown images ![alt](url)
        content = content.gsub(/!\[(.*?)\]\((.*?)\)/) do |match|
          alt_text = $1
          image_url = $2
          
          # Extract caption if available (format: ![alt](url) *caption*)
          caption = ""
          if content.match(/#{Regexp.escape(match)} \*(.*?)\*/)
            caption = content.match(/#{Regexp.escape(match)} \*(.*?)\*/)[1]
            content = content.gsub(/#{Regexp.escape(match)} \*(.*?)\*/, "") # Remove the original caption
          end
          
          # Build the HTML for the figure
          figure_html = %Q{
  <figure class="content-image">
    <img src="#{image_url}" alt="#{alt_text}" class="markdown-image">
    #{caption.empty? ? "" : "<figcaption>#{caption}</figcaption>"}
  </figure>
          }
          
          figure_html
        end
        
        # Process HTML images that might be in the content
        content = content.gsub(/<img(.*?)>/) do |match|
          attributes = $1
          
          # Extract src and alt
          src = attributes.match(/src="(.*?)"/)[1] rescue ""
          alt = attributes.match(/alt="(.*?)"/)[1] rescue ""
          
          # Build the HTML for the figure
          %Q{
  <figure class="content-image">
    <img#{attributes} class="markdown-image">
  </figure>
          }
        end
        
        # Process link-style references that contain image URLs
        content = content.gsub(/\[(.*?)\]\((https?:\/\/.*?\.(jpe?g|png|gif|svg))(.*?)\)/) do |match|
          alt_text = $1
          image_url = $2 + $3
          remaining = $4
          
          # Build the HTML for the figure
          figure_html = %Q{
  <figure class="content-image">
    <img src="#{image_url}" alt="#{alt_text}" class="markdown-image">
    <figcaption>#{alt_text}</figcaption>
  </figure>
          }
          
          figure_html
        end
        
        # Process Wikimedia-style links to optimize them for direct image display
        content = content.gsub(/\[(.*?)\]\((https?:\/\/commons\.wikimedia\.org\/wiki\/File:(.*?))\)/) do |match|
          alt_text = $1
          link_url = $2
          filename = $3
          
          # Convert to direct image URL using Special:FilePath
          image_url = "https://commons.wikimedia.org/wiki/Special:FilePath/#{filename}"
          
          # Build the HTML for the figure
          figure_html = %Q{
  <figure class="content-image">
    <img src="#{image_url}" alt="#{alt_text}" class="markdown-image">
    <figcaption>#{alt_text}</figcaption>
  </figure>
          }
          
          figure_html
        end
        
        content
      end
    end
  end
  
  Liquid::Template.register_filter(Jekyll::MarkdownImageFilter)