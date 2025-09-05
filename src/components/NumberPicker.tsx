import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NumberPickerProps {
  selectedNumbers: number[];
  onNumberSelect: (numbers: number[]) => void;
  maxNumbers?: number;
}

export const NumberPicker = ({ 
  selectedNumbers, 
  onNumberSelect, 
  maxNumbers = 6 
}: NumberPickerProps) => {
  const handleNumberClick = (number: number) => {
    if (selectedNumbers.includes(number)) {
      // Remove number if already selected
      onNumberSelect(selectedNumbers.filter(n => n !== number));
    } else if (selectedNumbers.length < maxNumbers) {
      // Add number if not at max capacity
      onNumberSelect([...selectedNumbers, number]);
    }
  };

  const generateRandomNumbers = () => {
    const numbers = new Set<number>();
    while (numbers.size < maxNumbers) {
      numbers.add(Math.floor(Math.random() * 100));
    }
    onNumberSelect(Array.from(numbers).sort((a, b) => a - b));
  };

  const clearNumbers = () => {
    onNumberSelect([]);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-foreground">
          Escolha suas 6 dezenas da sorte
        </h3>
        <p className="text-muted-foreground">
          Selecione {maxNumbers} números de 00 a 99 ({selectedNumbers.length}/{maxNumbers} selecionados)
        </p>
      </div>

      <div className="flex justify-center gap-4 mb-6">
        <Button 
          variant="lucky" 
          onClick={generateRandomNumbers}
          className="text-sm"
        >
          🎲 Surpresinha
        </Button>
        <Button 
          variant="outline" 
          onClick={clearNumbers}
          className="text-sm"
        >
          🗑️ Limpar
        </Button>
      </div>

      <div className="grid grid-cols-10 gap-2 max-w-4xl mx-auto">
        {Array.from({ length: 100 }, (_, i) => i).map((number) => {
          const isSelected = selectedNumbers.includes(number);
          const isDisabled = !isSelected && selectedNumbers.length >= maxNumbers;
          
          return (
            <Button
              key={number}
              variant={isSelected ? "hero" : "outline"}
              size="sm"
              className={cn(
                "aspect-square text-xs p-0 min-w-0",
                isSelected && "ring-2 ring-primary-glow",
                isDisabled && "opacity-30 cursor-not-allowed"
              )}
              onClick={() => handleNumberClick(number)}
              disabled={isDisabled}
            >
              {number.toString().padStart(2, '0')}
            </Button>
          );
        })}
      </div>

      {selectedNumbers.length > 0 && (
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">Seus números:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {selectedNumbers.sort((a, b) => a - b).map((number) => (
              <span
                key={number}
                className="inline-flex items-center justify-center w-8 h-8 bg-gradient-lucky text-primary-foreground rounded-full text-sm font-bold shadow-glow"
              >
                {number.toString().padStart(2, '0')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};