# frozen_string_literal: true

module Jekyll
  module RemoveCharsFilter
    # Remove emojis and special characters from text for search indexing
    EMOJI_PATTERN = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F000}-\u{1FFFF}]/
    SPECIAL_CHARS = /[*<>:;#$%^&{}@!~`=]/

    def remove_chars(input)
      return '' if input.nil?

      input
        .gsub(EMOJI_PATTERN, ' ')
        .gsub(SPECIAL_CHARS, ' ')
        .gsub(/\s+/, ' ')
        .strip
    end
  end
end

Liquid::Template.register_filter(Jekyll::RemoveCharsFilter)
