SHELL := /bin/bash
NODE_CMD := $(shell which node 2> /dev/null)

# a catch for ubuntu / debian
ifndef NODE_CMD
	NODE_CMD = $(shell which nodejs 2> /dev/null)
endif

all: build

# will always run b/c of deps target
build: deps ./src/*
	$(NODE_CMD) ./scripts/build.js

clean:
	rm -rf ./build
	rm -rf ./node_modules

install: build
	mkdir -p $(DESTDIR)/web; cp -Rvfap build/. $(DESTDIR)/web/

node_modules:
	npm install

nodecmd:
	@echo $(NODE_CMD)

deps: node_modules
pull: deps

.PHONY: clean deps install pull
