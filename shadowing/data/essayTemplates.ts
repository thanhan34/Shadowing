export type TemplateType = "adv_dis" | "cause_effect" | "problem_solution" | "opinion";

export type PracticeMode = "copy" | "missing" | "blind";

export type EssayTemplate = {
  id: string;
  type: TemplateType;
  label: string;
  paragraphs: string[];
};

export const essayTemplates: EssayTemplate[] = [
  {
    id: "adv_dis",
    type: "adv_dis",
    label: "Advantage / Disadvantage",
    paragraphs: [
      "The increasing prevalence of T in contemporary society has given rise to considerable debate. This matter is particularly significant due to its profound implications for key1, influencing both individuals and communities at large. The purpose of this essay is to examine the advantages and disadvantages of T and to provide a reasoned conclusion.",
      "To begin with, one of the most notable benefits associated with T is POINT1. This can primarily be attributed to the fact that EXPLANATION1. Moreover, another significant advantage of T is POINT2, as EXPLANATION2. Therefore, it is evident that the advantages of T deserve thorough consideration.",
      "Nevertheless, it is equally important to recognize that despite these advantages, there are drawbacks regarding T. A major drawback is POINT3, as EXPLANATION3. Furthermore, POINT4 poses challenges, thereby exerting substantial influence on both individuals and wider society. This is because EXPLANATION4. Hence, implementing effective measures to mitigate these issues is of paramount importance.",
      "In conclusion, it is apparent that T encompasses both advantages and disadvantages that warrant careful examination. While acknowledging the drawbacks, I strongly believe that greater emphasis should be placed on the benefits of T in order to secure more favorable outcomes for individuals and society as a whole."
    ]
  },
  {
    id: "cause_effect",
    type: "cause_effect",
    label: "Cause and Effect",
    paragraphs: [
      "The increasing prevalence of T in contemporary society has given rise to considerable debate. This matter is particularly significant due to its profound implications for key1, influencing both individuals and communities at large. The purpose of this essay is to analyze the causes and effects of T and to provide a reasoned conclusion.",
      "To begin with, one of the primary underlying causes of T is POINT1. This can primarily be attributed to the fact that EXPLANATION1. Moreover, another significant cause of T is POINT2, as EXPLANATION2. Therefore, it is evident that the causes of T deserve thorough consideration.",
      "Nevertheless, it is equally important to recognize that T leads to considerable effects. A major effect is POINT3, as EXPLANATION3. Furthermore, POINT4 generates consequences, thereby exerting substantial influence on both individuals and wider society. This is because EXPLANATION4. Hence, addressing these effects is of paramount importance.",
      "In conclusion, it is apparent that T involves multifaceted causes and effects that warrant careful examination. While acknowledging these effects, I strongly believe that addressing the root causes of T is essential to achieve sustainable outcomes."
    ]
  },
  {
    id: "problem_solution",
    type: "problem_solution",
    label: "Problem and Solution",
    paragraphs: [
      "The increasing prevalence of T in contemporary society has given rise to considerable debate. This matter is particularly significant due to its profound implications for key1, influencing both individuals and communities at large. The purpose of this essay is to discuss the problems and solutions related to T and to provide a reasoned conclusion.",
      "To begin with, one of the most pressing problems associated with T is POINT1. This can primarily be attributed to the fact that EXPLANATION1. Moreover, another significant problem of T is POINT2, as EXPLANATION2. Therefore, it is evident that the problems of T deserve serious attention.",
      "Nevertheless, it is equally important to recognize that there exist feasible solutions to address these problems. A major solution is POINT3, as EXPLANATION3. Furthermore, POINT4 provides remedies, thereby exerting substantial influence on both individuals and wider society. This is because EXPLANATION4. Hence, implementing effective measures to tackle these challenges is of paramount importance.",
      "In conclusion, it is apparent that T involves a range of problems and solutions that warrant careful examination. While acknowledging the existing challenges, I strongly believe that applying practical solutions can lead to more favorable outcomes for society."
    ]
  },
  {
    id: "opinion",
    type: "opinion",
    label: "Opinion (Agree / Disagree)",
    paragraphs: [
      "The increasing prevalence of T in contemporary society has given rise to considerable debate. This matter is particularly significant due to its profound implications for key1, influencing both individuals and communities at large. The purpose of this essay is to argue that I [[agree_or_disagree]] with the view that [[statement]] and to provide a reasoned conclusion.",
      "To begin with, one of the main reasons supporting my opinion is POINT1. This can primarily be attributed to the fact that EXPLANATION1. Moreover, another compelling reason is POINT2, as EXPLANATION2. Therefore, it is evident that these reasons strongly support my viewpoint.",
      "Nevertheless, it is equally important to recognize that some people hold the opposite opinion regarding T. A major counter-argument is POINT3, as EXPLANATION3. Furthermore, POINT4 strengthens the counter-view, thereby influencing public opinion. This is because EXPLANATION4. However, these arguments are not sufficient to change my stance.",
      "In conclusion, it is apparent that T involves supporting and opposing views that warrant careful examination. While acknowledging the counter-arguments, I strongly believe that my opinion regarding T is more convincing and beneficial for society as a whole."
    ]
  }
];

export const practiceModes: { value: PracticeMode; label: string }[] = [
  { value: "copy", label: "Copy Mode" },
  { value: "missing", label: "Missing Mode" },
  { value: "blind", label: "Blind Mode" }
];

export const getTemplateText = (template: EssayTemplate) =>
  template.paragraphs.join("\n");

export const getPracticeModeLabel = (mode: PracticeMode) => {
  const found = practiceModes.find(item => item.value === mode);
  return found ? found.label : "";
};