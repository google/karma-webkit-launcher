on run argv
	tell application "Safari"
		close documents where URL = (item 1 of argv)
	end tell
end run
