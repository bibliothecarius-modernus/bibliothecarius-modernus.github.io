module Jekyll
    module RemoveCharsFilter
      def remove_chars(input)
        input.gsub(/[\u{1F600}-\u{1F6FF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F900}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|\xE2[\x80-\x8F][\x80-\xBF]|\xEF\xB8[\x8F-\x8F]|\xE2\x9C[\x82-\x82]|\xE2\x9D[\xA4-\xA4]|\xE2\x99[\xA0-\xAF]|\xE2\x99[\xB0-\xBF]|\xE3[\x80-\xBF][\x80-\xBF]|\xF0[\x90-\xBF][\x80-\xBF][\x80-\xBF]|[*<>:;#$%^&{}@!~`=]/, ' ')
          .gsub(/\s+/, ' ')
          .gsub(/\n+/, ' ')
      end
    end
  end
  
  Liquid::Template.register_filter(Jekyll::RemoveCharsFilter)