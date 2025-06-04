
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Settings, Eye, EyeOff } from "lucide-react";

interface SubcategoryManagerProps {
  subcategories: string[];
  hiddenSubcategories?: string[];
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
  onToggleVisibility?: (name: string) => void;
}

const SubcategoryManager: React.FC<SubcategoryManagerProps> = ({
  subcategories,
  hiddenSubcategories = [],
  onAdd,
  onRemove,
  onToggleVisibility
}) => {
  const [newSubcategory, setNewSubcategory] = useState("");
  const [showManager, setShowManager] = useState(false);

  const handleAdd = () => {
    if (newSubcategory.trim() && !subcategories.includes(newSubcategory.trim())) {
      onAdd(newSubcategory.trim());
      setNewSubcategory("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  const isHidden = (subcategory: string) => hiddenSubcategories.includes(subcategory);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Manage Subcategories
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowManager(!showManager)}
          >
            {showManager ? "Hide" : "Show"} Manager
          </Button>
        </CardTitle>
      </CardHeader>
      
      {showManager && (
        <CardContent className="space-y-4">
          {/* Add new subcategory */}
          <div className="flex space-x-2">
            <Input
              placeholder="Enter new subcategory name..."
              value={newSubcategory}
              onChange={(e) => setNewSubcategory(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleAdd} disabled={!newSubcategory.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>

          {/* Current subcategories */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Current Subcategories:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {subcategories.map((subcategory) => (
                <div
                  key={subcategory}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                    isHidden(subcategory) 
                      ? 'bg-gray-100 opacity-60' 
                      : 'bg-gray-50'
                  }`}
                >
                  <span className={`text-sm ${isHidden(subcategory) ? 'line-through text-gray-500' : ''}`}>
                    {subcategory}
                  </span>
                  <div className="flex items-center space-x-1">
                    {onToggleVisibility && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleVisibility(subcategory)}
                        className={`h-6 w-6 p-0 ${
                          isHidden(subcategory)
                            ? 'text-gray-400 hover:text-gray-600'
                            : 'text-blue-600 hover:text-blue-800'
                        }`}
                        title={isHidden(subcategory) ? 'Show subcategory' : 'Hide subcategory'}
                      >
                        {isHidden(subcategory) ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(subcategory)}
                      className="text-red-600 hover:text-red-800 h-6 w-6 p-0"
                      title="Delete subcategory"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {subcategories.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No subcategories yet. Add your first one above!
            </p>
          )}

          {hiddenSubcategories.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> {hiddenSubcategories.length} subcategory(ies) are currently hidden from the tabs.
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default SubcategoryManager;
