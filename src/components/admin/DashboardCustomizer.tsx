import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Settings2, Plus, Trash2, Eye, EyeOff, Layers } from "lucide-react";
import { useDashboardPreferences, WidgetConfig, DashboardLayout } from "@/hooks/useDashboardPreferences";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/config";

const WIDGET_LABELS: Record<string, string> = {
  stats: "Statistiques principales",
  get conversion() { return i18n.t("ux.bo.conversionMetrics"); },
  get revenue() { return i18n.t("ux.bo.revenueChart"); },
  get service() { return i18n.t("ux.bo.bookingsService"); },
  get geographic() { return i18n.t("ux.bo.geographicBreakdown"); },
  get status() { return i18n.t("ux.bo.breakdownStatus2"); },
  get recent() { return i18n.t("ux.bo.recentBookings2"); },
};

interface SortableWidgetProps {
  widget: WidgetConfig;
  onToggle: (id: string) => void;
}

function SortableWidget({ widget, onToggle }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="p-3 flex items-center justify-between cursor-move hover:bg-accent/50 transition-colors">
        <div className="flex items-center gap-3 flex-1" {...attributes} {...listeners}>
          <div className="text-muted-foreground">☰</div>
          <span className="font-medium">{WIDGET_LABELS[widget.type] || widget.type}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(widget.id);
          }}
        >
          {widget.visible ? (
            <Eye className="h-4 w-4 text-success" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </Card>
    </div>
  );
}

export function DashboardCustomizer() {
  const { t } = useTranslation();
  const { layouts, activeLayout, saveLayout, setActive, deleteLayout } = useDashboardPreferences();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLayout, setEditingLayout] = useState<DashboardLayout | null>(null);
  const [layoutName, setLayoutName] = useState("");
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleNewLayout = () => {
    setEditingLayout(null);
    setLayoutName("");
    setWidgets(activeLayout?.widgetsConfig || []);
    setDialogOpen(true);
  };

  const handleEditLayout = (layout: DashboardLayout) => {
    setEditingLayout(layout);
    setLayoutName(layout.layoutName);
    setWidgets([...layout.widgetsConfig]);
    setDialogOpen(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((item, index) => ({ ...item, order: index }));
      });
    }
  };

  const handleToggleWidget = (widgetId: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === widgetId ? { ...w, visible: !w.visible } : w))
    );
  };

  const handleSave = async () => {
    if (!layoutName.trim()) return;

    const newLayout: DashboardLayout = {
      id: editingLayout?.id,
      layoutName: layoutName.trim(),
      widgetsConfig: widgets,
      isActive: false,
    };

    await saveLayout(newLayout);
    setDialogOpen(false);
  };

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" onClick={handleNewLayout}>
            <Settings2 className="h-4 w-4 mr-2" />
            {t("ux.bo.customize")}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLayout ? t("ux.bo.editView") : t("ux.bo.createNewView")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label>{t("ux.bo.viewName")}</Label>
              <Input
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
                placeholder={t("ux.bo.eGFullViewEssential")}
              />
            </div>

            <div className="space-y-3">
              <Label>{t("ux.bo.widgetsDragReorder")}</Label>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={widgets.map((w) => w.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {widgets.map((widget) => (
                      <SortableWidget
                        key={widget.id}
                        widget={widget}
                        onToggle={handleToggleWidget}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {t("ux.bo.cancel")}
              </Button>
              <Button onClick={handleSave} disabled={!layoutName.trim()}>
                {t("ux.bo.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Layout selector */}
      <Select
        value={activeLayout?.id || "default"}
        onValueChange={(value) => {
          if (value === "new") {
            handleNewLayout();
          } else if (value !== "default") {
            setActive(value);
          }
        }}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder={t("ux.bo.activeView")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">{t("ux.bo.defaultView")}</SelectItem>
          {layouts.map((layout) => (
            <SelectItem key={layout.id} value={layout.id!}>
              {layout.layoutName}
              {layout.isActive && <Badge className="ml-2" variant="secondary">{t("ux.bo.active")}</Badge>}
            </SelectItem>
          ))}
          <SelectItem value="new">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t("ux.bo.newView")}
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Layout management section - only show if layouts exist */}
      {layouts.length > 0 && dialogOpen && (
        <div className="mt-6 pt-6 border-t">
          <Label className="mb-3 block text-base">{t("ux.bo.manageViews")}</Label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {layouts.map((layout) => (
              <Card key={layout.id} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{layout.layoutName}</span>
                  {layout.isActive && <Badge variant="secondary" className="text-xs">{t("ux.bo.active")}</Badge>}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleEditLayout(layout);
                      setDialogOpen(true);
                    }}
                    className="h-8 px-2"
                  >
                    {t("ux.bo.edit")}
                  </Button>
                  {!layout.isActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => layout.id && deleteLayout(layout.id)}
                      className="h-8 px-2 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
