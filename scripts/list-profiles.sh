#!/bin/sh
ACTIVE=$(cat profiles/.active 2>/dev/null)
for dir in profiles/*/; do
  name=$(basename "$dir")
  if [ "$name" = "$ACTIVE" ]; then
    echo "* $name (active)"
  else
    echo "  $name"
  fi
done
