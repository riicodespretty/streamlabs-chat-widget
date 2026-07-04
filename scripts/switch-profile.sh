#!/bin/sh
PROFILE="$1"
PROFILE_DIR="profiles/$PROFILE"
if [ ! -d "$PROFILE_DIR" ]; then
  echo "Error: profile '$PROFILE' not found" >&2
  exit 1
fi
echo "$PROFILE" > profiles/.active
echo "Switched to profile: $PROFILE"
