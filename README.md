# anax-ui

## Introduction

This project contains the source code for the Horizon client web UI. To learn more about the Horizon system, including how to try the Blue Horizon instance of it, please browse to http://bluehorizon.network. Note that the **HEAD** of this repository's `master` branch includes alpha-grade code under current development. Stable versions of this application are bundled in Ubuntu Snaps (cf. https://www.ubuntu.com/desktop/snappy), consult the `bluehorizon-snap` project listed below to learn more.

Related Projects:

* `anax` (http://github.com/open-horizon/anax): The client control application in the Horizon system
* `bluehorizon-snap` (http://github.com/open-horizon/bluehorizon-snap): A Ubuntu Snappy bundling of the complete Horizon client components
* `ubuntu-classic-image` (http://github.com/open-horizon/ubuntu-classic-image): Produces complete system images

## Development and production deployment

## Preconditions

* Install `npm` and `node`

#### Start development server

* Execute `npm start` or `node scripts/start.js`

#### Build production-ready bundle

    make build
