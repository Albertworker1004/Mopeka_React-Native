#!/bin/bash

#optionally pass --release


if [[ ("$@" == *"--tankcheck"* && "$@" == *"--gasnow"* && "$@" == *"--mttracker"*) ]]; then
	echo "Expected a single arg for --tankcheck, --gasnow, or --mttracker"
	exit -1
fi

# Run this script once before so we can change the config name *before* we add the platform since this
# gives an error otherwise
CORDOVA_PLATFORMS="ios" CORDOVA_CMDLINE="$@" node hooks/before_prepare/before_prepare.js dummy `pwd`

# Force a clean slate
rm -rdf platforms plugins

#Add platform
cordova platform add ios@6.1.0 $@

#and build
cordova build ios $@ --device --buildConfig=build.json



