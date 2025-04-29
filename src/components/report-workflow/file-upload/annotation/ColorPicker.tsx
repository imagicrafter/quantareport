
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

const colors = [
  { value: '#8E9196', label: 'Neutral Gray' },
  { value: '#9b87f5', label: 'Primary Purple' },
  { value: '#F97316', label: 'Bright Orange' },
  { value: '#0EA5E9', label: 'Ocean Blue' },
  { value: '#D946EF', label: 'Magenta Pink' },
  { value: '#8B5CF6', label: 'Vivid Purple' },
  { value: '#ea384c', label: 'Red' },
  { value: '#33C3F0', label: 'Sky Blue' },
];

export const ColorPicker = ({ selectedColor, onColorChange }: ColorPickerProps) => {
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="w-8 h-8 p-0"
              style={{ backgroundColor: selectedColor }}
            >
              <span className="sr-only">Pick a color</span>
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Color Picker</p>
        </TooltipContent>
      </Tooltip>

      <PopoverContent className="w-auto p-2">
        <div className="grid grid-cols-4 gap-2">
          {colors.map((color) => (
            <Tooltip key={color.value}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-8 h-8 p-0"
                  style={{ backgroundColor: color.value }}
                  onClick={() => onColorChange(color.value)}
                >
                  <span className="sr-only">{color.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{color.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
