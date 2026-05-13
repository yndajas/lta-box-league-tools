#!/usr/bin/env ruby

require "csv"

SLOT_DURATION_SECONDS = 30 * 60

data = CSV.new(File.read("data.csv"), headers: true)
summary = {}

data.each do |row|
  day = Date.parse(row["Date"]).strftime("%A")

  next if day != "Sunday"

  slot = Time.parse(row["Time of booking"])
  remaining_seconds = row["Duration"].to_i * 60

  while remaining_seconds.positive?
    if summary[slot]
      summary[slot] += 1
    else
      summary[slot] = 1
    end

    slot += SLOT_DURATION_SECONDS
    remaining_seconds -= SLOT_DURATION_SECONDS
  end
end

summary.sort_by { |start_time, _count| start_time }.each do |start_time, count|
  puts "#{start_time.strftime('%H:%M')} => #{count}"
end
