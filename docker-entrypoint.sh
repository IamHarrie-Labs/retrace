#!/bin/sh
# Hosted volumes (Fly, Railway, Render) are often mounted owned by root. When started as root,
# give the data directory to the app user, then drop privileges. Otherwise just run.
set -e
if [ "$(id -u)" = "0" ]; then
  mkdir -p "$RETRACE_DATA_DIR"
  chown -R retrace:retrace "$RETRACE_DATA_DIR"
  exec setpriv --reuid=retrace --regid=retrace --init-groups "$@"
fi
exec "$@"
