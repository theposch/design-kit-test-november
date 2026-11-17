import type { LucideIcon } from 'lucide-react';
import { Search } from 'lucide-react';

import * as Autocomplete from '#components/atoms/Autocomplete';
import * as Dialog from '#components/atoms/Dialog';
import { Kbd } from '#components/atoms/Kbd';
import { cn } from '#lib/utils';

export type Command = {
  value: string;
  label: string;
  /** Any icon from lucide-react, shown before the label. */
  icon?: LucideIcon;
  /** A shortcut shown at the end, such as "⌘N". */
  shortcut?: string;
};

export type CommandGroup = { label: string; items: Command[] };

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Names the palette and its search box for screen readers ("Search"). */
  label: string;
  placeholder: string;
  /** Shown when nothing matches what was typed. */
  emptyText: string;
  /** Keys explained under the list, e.g. { key: 'Enter', label: 'to open' }. */
  hints: { key: string; label: string }[];
  groups: CommandGroup[];
  /** Runs when someone picks a command; the palette then closes. */
  onSelect: (command: Command) => void;
  className?: string;
};

/*
 * Search-to-jump: a dialog with a search box over grouped commands. Open it
 * from a search button and from ⌘K; arrow keys move and Enter picks.
 */
export function CommandPalette({
  open,
  onOpenChange,
  label,
  placeholder,
  emptyText,
  hints,
  groups,
  onSelect,
  className,
}: CommandPaletteProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup
          aria-label={label}
          className={cn('top-24 max-w-xl translate-y-0 gap-0 p-0', className)}
        >
          <Autocomplete.Root
            open
            inline
            items={groups}
            autoHighlight="always"
            keepHighlight
            itemToStringValue={(command: Command) => command.label}
          >
            <div className="border-border border-b p-2">
              <Autocomplete.InputGroup className="border-0 shadow-none">
                <Search aria-hidden className="text-muted-foreground" />
                <Autocomplete.Input
                  aria-label={label}
                  placeholder={placeholder}
                />
              </Autocomplete.InputGroup>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              <Autocomplete.Empty className="px-2 py-6 text-center">
                {emptyText}
              </Autocomplete.Empty>
              <Autocomplete.List>
                {(group: CommandGroup) => (
                  <Autocomplete.Group key={group.label} items={group.items}>
                    <Autocomplete.GroupLabel>
                      {group.label}
                    </Autocomplete.GroupLabel>
                    <Autocomplete.Collection>
                      {(command: Command) => {
                        const Glyph = command.icon;
                        return (
                          <Autocomplete.Item
                            key={command.value}
                            value={command}
                            onClick={() => {
                              onSelect(command);
                              onOpenChange(false);
                            }}
                          >
                            {Glyph && (
                              <Glyph
                                aria-hidden
                                className="text-muted-foreground"
                              />
                            )}
                            <span className="min-w-0 flex-1 truncate">
                              {command.label}
                            </span>
                            {command.shortcut && <Kbd>{command.shortcut}</Kbd>}
                          </Autocomplete.Item>
                        );
                      }}
                    </Autocomplete.Collection>
                  </Autocomplete.Group>
                )}
              </Autocomplete.List>
            </div>
            <div className="border-border type-body-xs text-muted-foreground flex items-center gap-4 border-t px-4 py-2">
              {hints.map((hint) => (
                <span key={hint.key} className="flex items-center gap-1">
                  <Kbd>{hint.key}</Kbd> {hint.label}
                </span>
              ))}
            </div>
          </Autocomplete.Root>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
