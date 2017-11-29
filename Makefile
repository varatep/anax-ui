SHELL := /bin/bash

NODE_CMD = $(shell which nodejs 2> /dev/null || echo "node")
NPM_CMD = $(shell (PATH=/usr/local/bin:$$PATH; which npm-cache) 2> /dev/null || echo "npm")

all: deps all-nodeps
all-nodeps: build

# will always run b/c of deps target
build: ./src/*
	$(NODE_CMD) ./scripts/build.js

clean:
	rm -rf ./build
	rm -rf ./node_modules

install:
	mkdir -p $(DESTDIR)/web; cp -Rvfap build/. $(DESTDIR)/web/

node_modules:
	$(NPM_CMD) install

nodecmd:
	@echo "Using node command: $(NODE_CMD)"

npmcmd:
	@echo "Using npm command: $(NPM_CMD)"

deps: node_modules
pull: deps

.PHONY: build clean deps install pull
