import {
  QuestionBatchValidationError,
  QuestionBatchValidator,
} from "./question-batch.validator";

const validMultipleChoice = {
  type: "multiple_choice",
  text: "Care este capitala României?",
  options: ["București", "Iași", "Cluj-Napoca", "Timișoara"],
  correctAnswer: "București",
  explanation: "București este capitala României din anul 1862.",
  verificationSource: "Encyclopaedia Britannica, articolul Bucharest.",
};

describe("QuestionBatchValidator", () => {
  const validator = new QuestionBatchValidator();

  it("acceptă un lot grilă valid", () => {
    expect(
      validator.validate(
        JSON.stringify({ questions: [validMultipleChoice] }),
        1,
      ),
    ).toHaveLength(1);
  });

  it("respinge JSON malformat", () => {
    expect(() => validator.validate("```json\n{}\n```", 1)).toThrow(
      QuestionBatchValidationError,
    );
  });

  it("respinge răspunsul care nu există între variante", () => {
    const invalid = { ...validMultipleChoice, correctAnswer: "Brașov" };
    expect(() =>
      validator.validate(JSON.stringify({ questions: [invalid] }), 1),
    ).toThrow("Răspunsul corect trebuie să fie una dintre variante.");
  });

  it("respinge variante echivalente după normalizarea diacriticelor", () => {
    const invalid = {
      ...validMultipleChoice,
      options: ["Fotosinteză", "Respirație", "Fotosinteza", "Fermentație"],
      correctAnswer: "Fotosinteză",
    };
    expect(() =>
      validator.validate(JSON.stringify({ questions: [invalid] }), 1),
    ).toThrow("Cele patru variante trebuie să fie distincte.");
  });

  it("respinge întregul lot dacă numărul de întrebări diferă", () => {
    expect(() =>
      validator.validate(
        JSON.stringify({ questions: [validMultipleChoice] }),
        2,
      ),
    ).toThrow("au fost cerute 2");
  });

  it("acceptă un răspuns numeric finit și respinge unul invalid", () => {
    const numeric = {
      type: "numeric",
      text: "Câte grade are suma unghiurilor unui triunghi?",
      options: null,
      correctAnswer: "180",
      explanation:
        "Suma unghiurilor interioare ale unui triunghi este 180 de grade.",
      verificationSource: "Teorema sumei unghiurilor unui triunghi.",
    };
    expect(
      validator.validate(JSON.stringify({ questions: [numeric] }), 1),
    ).toHaveLength(1);
    expect(() =>
      validator.validate(
        JSON.stringify({
          questions: [{ ...numeric, correctAnswer: "nu este număr" }],
        }),
        1,
      ),
    ).toThrow("Răspunsul numeric trebuie să fie un număr finit.");
  });
});
