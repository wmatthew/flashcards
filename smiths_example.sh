# Example usage of converter.js

# Fronts of cards
node js/converter.js                            \
  -v                                            \
  --overwrite                                   \
  --template=input/templates/template_front.svg \
  --csv=input/data/smiths_example.csv           \
  --svg=output/smiths/svg/                      \
  --png=output/smiths/png/                      ;

# TODO: also create backs of cards???