# Catalog and panels

[Русский](<../catalog-and-panels.md>) · [English](<catalog-and-panels.md>) · [Contents](<README.md>)

The Objects panel has Independent and Linked sections. By default text/fog are independent, while small/large stars and network require a source. Sections lets users change classification. A category only organizes the catalog; it cannot remove an effect's actual requirements. Mismatches show an explanation.

Classification is stored in profile localStorage separately from the project, synchronizes across windows and does not change dirty/undo. Portable profiles live in Data/Profile and move with the application. Resetting layout does not reset categories.

Drag panel tabs to move them, close them or restore them through Window. The optional Panels panel provides + for another embedded view and ↗ for an additional window. A new layout does not open it automatically. Detached windows do not overwrite the main layout.

The catalog uses the same SDK component in embedded and detached views. Additional Canvas views share clocks but have independent cameras. Marker-based legacy layout upgrades add the catalog while respecting panels intentionally closed after migration. See [object creation](object-creation.md) and [compact layout](compact-layout.md).
