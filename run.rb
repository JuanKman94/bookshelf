#!/usr/bin/env ruby
# frozen_string_literal: true
#
# Serve files from current directory on an HTTP server

require "un"

BOOKS = [
  ["Dracula", "novels/Dracula.epub"],
  ["Chokepoint Capitalism", "Chokepoint Capitalism ebooks/ChokepointCapitalism_uuid.epub"],
].freeze

def find_epub
  Dir[File.join(File.dirname(File.realdirpath(__FILE__)), '**/*.epub')].map {}
end

if File.exist?("index.html.erb")
  require "bundler/inline"

  gemfile do
    source "https://rubygems.org"
    gem "erubi", "~> 1.11.0"
    gem "webrick", "~> 1.7.0"
  end

  File.write("index.html", eval(Erubi::Engine.new(File.read("index.html.erb")).src))
end

httpd
