# BuddyGenAI Bugs & Issues

- Got UI toast error that chat server is offline during first character setup, wouldn't generate appearance options even though chat was working.
  - I think this is because of typing in a host address for KoboldCpp trigering multiple requests. Eventually you'll type a working address which flags the server as running, but the prior requests will fail after this which triggers the catch block, setting the server as not running. I think we need to set an abort controller on the connection checks, cancel it when we get a successful check.
- The sidebar doesn't (always?) appear after first-time-setup upon creating a Buddy (also didn't generate a picture for them).
- Got console/Dexie error when generating Buddy image (popped when image being ready): "Failed to execute 'bound' on 'IDBKeyRange': The parameter is not a valid key.\n DataError: Failed to execute 'bound' on 'IDBKeyRange': The parameter is not a valid key."
  - After clicking Save and refreshing, the profile picture persisted. Actually, don't even need to click Save, so it does in fact save (and also updates the display).
