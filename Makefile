
BUILD_FILE=package.zip

clean:
	rm $(BUILD_FILE)
	@echo "Release zip deleted - " $(BUILD_FILE)

build:
	zip $(BUILD_FILE) manifest.json heartrate.js icons/*