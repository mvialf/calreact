import * as React from "react";
import { Plus, Tag as TagIcon, EllipsisVertical, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TagBadge } from "@/components/ui/tag-badge";
import type { TagSelectorProps, Tag, TagColor, CreateTagData } from "@/types/tags";
import { TAG_COLOR_MAP, AVAILABLE_TAG_COLORS } from "@/types/tags";

/**
 * Componente TagSelector - Selector de etiquetas con popover estilo Trello
 * Permite seleccionar múltiples etiquetas y crear nuevas
 */
export const TagSelector = React.forwardRef<HTMLDivElement, TagSelectorProps>(
  ({ 
    selectedTags, 
    availableTags, 
    onTagsChange, 
    onCreateTag,
    onEditTag,
    onDeleteTag,
    placeholder = "Seleccionar etiquetas...",
    label,
    className,
    ...props 
  }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [isCreating, setIsCreating] = React.useState(false);
    const [newTagName, setNewTagName] = React.useState("");
    const [newTagColor, setNewTagColor] = React.useState<TagColor>("primary");

    // Filtrar etiquetas disponibles que no están seleccionadas
    const unselectedTags = availableTags.filter(
      tag => !selectedTags.some(selected => selected.id === tag.id)
    );

    const handleTagToggle = (tag: Tag) => {
      const isSelected = selectedTags.some(selected => selected.id === tag.id);
      
      if (isSelected) {
        // Remover etiqueta
        onTagsChange(selectedTags.filter(selected => selected.id !== tag.id));
      } else {
        // Agregar etiqueta
        onTagsChange([...selectedTags, tag]);
      }
    };

    const handleRemoveTag = (tagId: string) => {
      onTagsChange(selectedTags.filter(tag => tag.id !== tagId));
    };

    const handleCreateTag = () => {
      if (!newTagName.trim() || !onCreateTag) return;

      onCreateTag(newTagName.trim(), newTagColor);
      setNewTagName("");
      setNewTagColor("primary");
      setIsCreating(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && newTagName.trim()) {
        e.preventDefault();
        handleCreateTag();
      }
      if (e.key === "Escape") {
        setIsCreating(false);
        setNewTagName("");
      }
    };

    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {/* Label con botón de tag */}
        {label && (
          <div className="flex items-center justify-start gap-2">
            <Label className="text-sm font-medium">{label}</Label>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  aria-label="Gestionar etiquetas"
                >
                  <TagIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4">
                  <h4 className="font-medium leading-none mb-3">Etiquetas</h4>
                  
                  {/* Lista de etiquetas disponibles */}
                  {unselectedTags.length > 0 && (
                    <div className="space-y-1 mb-3">
                      <Label className="text-xs text-muted-foreground">
                        Disponibles
                      </Label>
                      {unselectedTags.map((tag) => (
                        <div
                          key={tag.id}
                          className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleTagToggle(tag)}
                        >
                          <Checkbox
                            checked={false}
                            onCheckedChange={() => handleTagToggle(tag)}
                            className="shrink-0"
                          />
                          <TagBadge tag={tag} className="w-full py-2" />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <EllipsisVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {onEditTag && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditTag(tag.id, tag.name, tag.color);
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                              )}
                              {onDeleteTag && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteTag(tag.id);
                                  }}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Etiquetas seleccionadas */}
                  {selectedTags.length > 0 && (
                    <div className="space-y-1 mb-3">
                      <Label className="text-xs text-muted-foreground">
                        Seleccionadas
                      </Label>
                      {selectedTags.map((tag) => (
                        <div
                          key={tag.id}
                          className="flex items-center space-x-2 p-2 rounded-md bg-muted/50 hover:bg-muted/70 cursor-pointer"
                          onClick={() => handleTagToggle(tag)}
                        >
                          <Checkbox
                            checked={true}
                            onCheckedChange={() => handleTagToggle(tag)}
                            className="shrink-0"
                          />
                          <TagBadge tag={tag} className="shrink-0" />
                          <span className="flex-1 text-left">{tag.name}</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <EllipsisVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {onEditTag && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditTag(tag.id, tag.name, tag.color);
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                              )}
                              {onDeleteTag && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteTag(tag.id);
                                  }}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  )}

                  {(unselectedTags.length > 0 || selectedTags.length > 0) && onCreateTag && (
                    <Separator className="my-3" />
                  )}

                  {/* Crear nueva etiqueta */}
                  {onCreateTag && (
                    <div className="space-y-3">
                      {!isCreating ? (
                        <Button
                          variant="ghost"
                          className="w-full justify-start hover:bg-muted/50"
                          onClick={() => setIsCreating(true)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Crear nueva etiqueta
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="tag-name" className="text-xs">
                              Nombre de la etiqueta
                            </Label>
                            <Input
                              id="tag-name"
                              placeholder="Nombre de la etiqueta..."
                              value={newTagName}
                              onChange={(e) => setNewTagName(e.target.value)}
                              onKeyDown={handleKeyDown}
                              className="h-8"
                              autoFocus
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Color</Label>
                            <div className="grid grid-cols-3 gap-1">
                              {AVAILABLE_TAG_COLORS.map(({ color, label }) => {
                                const colorClasses = TAG_COLOR_MAP[color];
                                const isSelected = newTagColor === color;
                                
                                return (
                                  <Button
                                    key={color}
                                    type="button"
                                    variant="ghost"
                                    className={cn(
                                      "h-8 p-1 border-2 relative",
                                      colorClasses.bg,
                                      colorClasses.text,
                                      isSelected 
                                        ? "border-current ring-2 ring-offset-2 ring-current" 
                                        : "border-transparent hover:border-current/50"
                                    )}
                                    onClick={() => setNewTagColor(color)}
                                    title={label}
                                  >
                                    <div className="w-full h-4 rounded-sm" />
                                    {isSelected && (
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-2 h-2 bg-current rounded-full" />
                                      </div>
                                    )}
                                  </Button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleCreateTag}
                              disabled={!newTagName.trim()}
                              className="flex-1"
                            >
                              Crear
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setIsCreating(false);
                                setNewTagName("");
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
        
        {/* Etiquetas seleccionadas */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selectedTags.map((tag) => (
              <TagBadge
                key={tag.id}
                tag={tag}
                removable
                onRemove={handleRemoveTag}
              />
            ))}
          </div>
        )}


      </div>
    );
  }
);

TagSelector.displayName = "TagSelector";
