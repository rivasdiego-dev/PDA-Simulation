import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, Minus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "./components/ui/switch";
import { FaArrowAltCircleRight, FaArrowAltCircleLeft } from "react-icons/fa";

// Type Definitions
type PDA = {
  alphabet: string[];
  states: number;
  acceptedStates: number[];
  stack: string[];
  instructions: Map<string, string[]>;
};

type SimulationStep = {
  state: number;
  inputLeft: string;
  stack: string[];
};

// Constants
const VOID_SYMBOL = "ε";
const STACK_BOTTOM = "$";

// Main Component
export default function App() {
  const [pda, setPda] = useState<PDA>({
    alphabet: [],
    stack: [STACK_BOTTOM],
    states: 1,
    acceptedStates: [],
    instructions: new Map(),
  });

  const [newSymbol, setNewSymbol] = useState("");
  const [instructionsGenerated, setInstructionsGenerated] = useState(false);
  const [inputString, setInputString] = useState("");
  const [simulationSteps, setSimulationSteps] = useState<SimulationStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [simulationResult, setSimulationResult] = useState<string | null>(null);

  const [mode, setMode] = useState<"auto" | "manual">("auto");

  // Handlers for updating the PDA state
  const addSymbol = () => {
    if (newSymbol && !pda.alphabet.includes(newSymbol)) {
      setPda({ ...pda, alphabet: [...pda.alphabet, newSymbol] });
      setNewSymbol("");
    }
  };

  const removeSymbol = (symbol: string) => {
    setPda({ ...pda, alphabet: pda.alphabet.filter((s) => s !== symbol) });
  };

  const incrementStates = () => {
    setPda({ ...pda, states: pda.states + 1 });
  };

  const decrementStates = () => {
    if (pda.states > 1) {
      setPda({
        ...pda,
        states: pda.states - 1,
        acceptedStates: pda.acceptedStates.filter(
          (state) => state < pda.states - 1
        ),
      });
    }
  };

  const toggleAcceptedState = (state: number) => {
    setPda((prevPda) => ({
      ...prevPda,
      acceptedStates: prevPda.acceptedStates.includes(state)
        ? prevPda.acceptedStates.filter((s) => s !== state)
        : [...prevPda.acceptedStates, state],
    }));
  };

  // Instruction-related functions
  const generateInstructionKeys = () => {
    const newInstructions = new Map<string, string[]>();
    for (let state = 0; state < pda.states; state++) {
      for (const symbol of pda.alphabet) {
        const key = `${state}-${symbol}`;
        newInstructions.set(key, ["", VOID_SYMBOL, VOID_SYMBOL]);
      }
    }
    setPda({ ...pda, instructions: newInstructions });
    setInstructionsGenerated(true);
  };

  const updateInstruction = (key: string, index: number, value: string) => {
    const newInstructions = new Map(pda.instructions);
    const instruction = newInstructions.get(key) || [
      "",
      VOID_SYMBOL,
      VOID_SYMBOL,
    ];
    instruction[index] = value;
    newInstructions.set(key, instruction);
    setPda({ ...pda, instructions: newInstructions });
  };

  const resetInstructions = () => {
    setPda({ ...pda, instructions: new Map() });
    setInstructionsGenerated(false);
  };

  // Effect to reset instructions when alphabet or states change
  useEffect(() => {
    resetInstructions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pda.alphabet, pda.states]);

  // Simulation functions
  const runSimulation = () => {
    let currentState = 0;
    let input = inputString;
    const currentStack = [STACK_BOTTOM];
    const steps: SimulationStep[] = [
      {
        state: currentState,
        inputLeft: input,
        stack: [...currentStack],
      },
    ];

    while (input.length > 0) {
      const currentSymbol = input[0];
      const key = `${currentState}-${currentSymbol}`;
      const instruction = pda.instructions.get(key);

      if (!instruction) {
        setSimulationResult("Cadena rechazada - No hay instrucción definida");
        setSimulationSteps(steps);
        setCurrentStep(0);
        return;
      }

      const [nextState, pop, push] = instruction;

      if (pop !== VOID_SYMBOL) {
        if (currentStack[currentStack.length - 1] !== pop) {
          if (currentStack[currentStack.length - 1] === STACK_BOTTOM) {
            setSimulationResult(
              "Cadena rechazada - Intento de pop en pila vacía"
            );
            setSimulationSteps(steps);
            setCurrentStep(0);
            return;
          }
          setSimulationResult(
            "Cadena rechazada - Símbolo incorrecto en la cima de la pila"
          );
          setSimulationSteps(steps);
          setCurrentStep(0);
          return;
        }
        currentStack.pop();
      }

      if (push !== VOID_SYMBOL) {
        currentStack.push(push);
      }

      currentState = parseInt(nextState.slice(1));
      input = input.slice(1);

      steps.push({
        state: currentState,
        inputLeft: input,
        stack: [...currentStack],
      });
    }

    setSimulationSteps(steps);
    setCurrentStep(0);

    const isAccepted =
      pda.acceptedStates.includes(currentState) &&
      currentStack.length === 1 &&
      currentStack[0] === STACK_BOTTOM;
    setSimulationResult(isAccepted ? "Cadena aceptada" : "Cadena rechazada");
  };

  useEffect(() => {
    if (
      mode === "auto" &&
      simulationSteps.length > 0 &&
      currentStep < simulationSteps.length
    ) {
      const timer = setTimeout(() => {
        setCurrentStep((prevStep) => prevStep + 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [mode, currentStep, simulationSteps]);

  // JSX for rendering the component
  return (
    <main className="w-full min-h-dvh bg-[#09090b] py-32 px-28">
      <h1 className="text-white text-4xl mb-4">Pushdown Automata</h1>

      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Pushdown Automata Simulator</CardTitle>
          <CardDescription>
            Define los parámetros de la PDA y ejecuta la simulación.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="parameters">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="parameters">Parámetros</TabsTrigger>
              <TabsTrigger value="simulation">Simulación</TabsTrigger>
            </TabsList>
            <TabsContent value="parameters">
              <div className="grid w-full items-center gap-6">
                {/* Alphabet Section */}
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="alphabet">Alfabeto</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="alphabet"
                      value={newSymbol}
                      onChange={(e) => setNewSymbol(e.target.value)}
                      placeholder="Ingrese un símbolo"
                      className="flex-grow"
                    />
                    <Button onClick={addSymbol}>Agregar</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {pda.alphabet.map((symbol, index) => (
                      <span
                        key={index}
                        className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md flex items-center"
                      >
                        {symbol}
                        <button
                          onClick={() => removeSymbol(symbol)}
                          className="ml-2 text-secondary-foreground/70 hover:text-secondary-foreground"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <p className="text-muted-foreground text-sm mt-1">
                    Agregue los símbolos del alfabeto uno por uno.
                  </p>
                </div>

                {/* States Section */}
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="states">Estados</Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="icon"
                      onClick={decrementStates}
                      disabled={pda.states <= 1}
                    >
                      <Minus />
                    </Button>
                    <span className="text-lg font-semibold">{pda.states}</span>
                    <Button size="icon" onClick={incrementStates}>
                      <Plus />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.from({ length: pda.states }, (_, i) => (
                      <Button
                        key={i}
                        variant={
                          pda.acceptedStates.includes(i)
                            ? "secondary"
                            : "outline"
                        }
                        className={`rounded-full w-10 h-10 p-0 ${
                          pda.acceptedStates.includes(i)
                            ? "border-2 border-primary"
                            : ""
                        }`}
                        onClick={() => toggleAcceptedState(i)}
                      >
                        q{i}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      className="rounded-full w-10 h-10 p-0 bg-destructive text-destructive-foreground"
                      disabled
                    >
                      qk
                    </Button>
                  </div>
                  <p className="text-muted-foreground text-sm mt-1">
                    Haga clic en los estados para marcarlos como aceptados. El
                    estado qk es el estado de rechazo por defecto.
                  </p>
                </div>

                {/* Instructions Section */}
                <div className="flex flex-col space-y-1.5">
                  <Label>Instrucciones</Label>
                  <div className="flex space-x-2">
                    <Button
                      onClick={generateInstructionKeys}
                      disabled={instructionsGenerated}
                    >
                      Generar Claves
                    </Button>
                    <Button
                      onClick={resetInstructions}
                      disabled={!instructionsGenerated}
                    >
                      Reiniciar Instrucciones
                    </Button>
                  </div>
                  {instructionsGenerated && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Estado-Símbolo</TableHead>
                          <TableHead>Mover a Estado</TableHead>
                          <TableHead>Pop</TableHead>
                          <TableHead>Push</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.from(pda.instructions.entries()).map(
                          ([key, instruction]) => (
                            <TableRow key={key}>
                              <TableCell>{key}</TableCell>
                              <TableCell>
                                <Select
                                  value={instruction[0]}
                                  onValueChange={(value) =>
                                    updateInstruction(key, 0, value)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar estado" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from(
                                      { length: pda.states },
                                      (_, i) => (
                                        <SelectItem key={i} value={`q${i}`}>
                                          q{i}
                                        </SelectItem>
                                      )
                                    )}
                                    <SelectItem value="qk">qk</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={instruction[1]}
                                  onValueChange={(value) =>
                                    updateInstruction(key, 1, value)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar Pop" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={VOID_SYMBOL}>
                                      {VOID_SYMBOL} (Vacío)
                                    </SelectItem>
                                    {pda.alphabet.map((symbol, index) => (
                                      <SelectItem key={index} value={symbol}>
                                        {symbol}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={instruction[2]}
                                  onValueChange={(value) =>
                                    updateInstruction(key, 2, value)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar Push" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={VOID_SYMBOL}>
                                      {VOID_SYMBOL} (Vacío)
                                    </SelectItem>
                                    {pda.alphabet.map((symbol, index) => (
                                      <SelectItem key={index} value={symbol}>
                                        {symbol}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="simulation">
              <div className="flex flex-col space-y-4">
                <div>
                  <Label htmlFor="inputString">Cadena de entrada</Label>
                  <Input
                    id="inputString"
                    value={inputString}
                    onChange={(e) => setInputString(e.target.value)}
                    placeholder="Ingrese la cadena a evaluar"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="mode"
                    checked={mode === "auto"}
                    onCheckedChange={() =>
                      setMode((prev) => (prev === "auto" ? "manual" : "auto"))
                    }
                  />
                  <Label htmlFor="mode">Automatic mode</Label>
                </div>
                <Button
                  onClick={runSimulation}
                  disabled={!instructionsGenerated}
                >
                  Iniciar Simulación
                </Button>
                {/* Manual mode */}
                {mode === "manual" && (
                  <div className="flex gap-8">
                    <Button
                      className="flex gap-2 items-center"
                      disabled={simulationSteps.length === 0 || currentStep <= 0}
                      onClick={() => setCurrentStep((prev) => prev - 1)}
                    >
                      Anterior
                      <FaArrowAltCircleLeft />
                    </Button>
                    <Button
                      className="flex gap-2 items-center"
                      disabled={simulationSteps.length === 0 || currentStep >= simulationSteps.length}
                      onClick={() => setCurrentStep((prev) => prev + 1)}
                    >
                      Siguiente
                      <FaArrowAltCircleRight />
                    </Button>
                  </div>
                )}
                {simulationSteps.length > 0 &&
                  currentStep < simulationSteps.length && (
                    <div className="bg-secondary p-4 rounded-md">
                      <h3 className="text-lg font-semibold mb-2">
                        Paso {currentStep + 1} de {simulationSteps.length}
                      </h3>
                      <div className="flex justify-center space-x-2 mb-4">
                        {Array.from({ length: pda.states }, (_, i) => (
                          <div
                            key={i}
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              i === simulationSteps[currentStep].state
                                ? "!bg-primary text-primary-foreground"
                                : "bg-secondary-foreground/20"
                            }`}
                          >
                            q{i}
                          </div>
                        ))}
                      </div>
                      <p>
                        Entrada restante:{" "}
                        {simulationSteps[currentStep].inputLeft}
                      </p>
                      <p>
                        Pila: {simulationSteps[currentStep].stack.join(", ")}
                      </p>
                    </div>
                  )}
                {simulationResult && currentStep === simulationSteps.length && (
                  <div
                    className={`p-4 rounded-md ${
                      simulationResult === "Cadena aceptada"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    <p className="font-semibold">{simulationResult}</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}
