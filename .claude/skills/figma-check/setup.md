# Setting up the Figma console tool

Every Figma skill reads and writes Figma through the figma-console MCP. Claude sets it up; the person only restarts
Claude and adds a plugin in Figma, the two steps Claude can't do.

## Is it there?

Look for its tools (`figma_get_status`). Missing, run:

```bash
claude mcp get figma-console
```

- **"No MCP server named figma-console":** not installed. Set it up below.
- **Listed, but its tools are missing or it says it failed:** installed but not running. Ask the person to restart
  Claude (quit and reopen the app, or start a new `claude` in the terminal). Still failing: `claude mcp list` shows the
  error.
- **Tools there, but `figma_get_status` says no bridge:** the Figma plugin isn't running. Step 3 below.

## Set it up

1. **Ask once:** _"The Figma skills need the Figma console tool, and it isn't installed. Can I add it to your Claude
   settings? It's for every project on this computer, and you can remove it any time."_ It changes the person's
   settings, so never add it without a yes.
2. **Add it:**

   ```bash
   claude mcp add figma-console -s user -e ENABLE_MCP_APPS=true -- "$HOME/.local/share/mise/shims/pnpm" dlx figma-console-mcp@latest
   ```

   Through pnpm, never `npx`: Claude starts the tool from the project folder, and there `npx` refuses to run (the
   project allows only pnpm). The full path to mise's pnpm works from every folder and in the Claude app, which may not
   see the shell's `PATH`. No mise yet: set up the computer first with the `env-setup` skill.

   No Figma access key: reading files, running the extractor and taking pictures all go through the plugin, which
   works on every Figma plan without one. Then ask the person to restart Claude, so the new tools load.

3. **The plugin in Figma (the person does this once).** Get the plugin's path and copy it for them:

   ```bash
   cd ~ && "$HOME/.local/share/mise/shims/pnpm" dlx figma-console-mcp@latest --print-path 2>/dev/null | grep manifest.json | tr -d '\n' | pbcopy
   ```

   It is usually `~/.figma-console-mcp/plugin/manifest.json`. Then give them these steps:
   1. In the Figma desktop app (not the browser), open any design file.
   2. Menu → Plugins → Development → Import plugin from manifest…
   3. Press ⌘⇧G, paste the copied path, press Return, then Open. (The folder is hidden, which is why it's pasted.)
   4. Run it: Plugins → Development → Figma Desktop Bridge. Keep its small window open while working.

4. **Check it:** `figma_get_status` shows the bridge connected and the file's name. Done.

## The Figma access key, only if needed

A few tools go through Figma's web service instead of the plugin, `figma_get_component_image` (picture links) for one,
and say so when they fail without a key. Then either use the plugin's way (`figma_execute` with `exportAsync`, see
reference.md "Pictures out of Figma"), or ask the person to add a key:

- They make it themselves in Figma: Settings → Security → Personal access tokens, with read access to file content.
- Claude never types, pastes or stores a key. Give them the command to run in their own terminal, with the key in
  place of `<key>`:

  ```bash
  claude mcp remove figma-console -s user && claude mcp add figma-console -s user -e FIGMA_ACCESS_TOKEN=<key> -e ENABLE_MCP_APPS=true -- "$HOME/.local/share/mise/shims/pnpm" dlx figma-console-mcp@latest
  ```
