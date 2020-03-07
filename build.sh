#!/bin/sh

rm -rf dist
mkdir -p dist
zip -j9 dist/gnome-shell-extension-verticalmax.zip src/*
glib-compile-schemas ~/.local/share/gnome-shell/extensions/maxi@darkretailer.github.com/schemas