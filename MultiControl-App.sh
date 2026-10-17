#!/bin/bash
# Lanzador de un clic para Inagerlibox
systemctl --user is-active --quiet multicontrol.service || systemctl --user start multicontrol.service

if which google-chrome >/dev/null 2>&1; then
    google-chrome --app=http://localhost:5174/ &
elif which brave-browser >/dev/null 2>&1; then
    brave-browser --app=http://localhost:5174/ &
elif which chromium >/dev/null 2>&1; then
    chromium --app=http://localhost:5174/ &
else
    xdg-open http://localhost:5174/ &
fi
