# Example usage of converter.js

# Fronts of cards
node js/converter.js                      \
  -v                                      \
  --overwrite                             \
  --template=input/templates/template.svg \
  --csv=input/data/example.csv            \
  --svg=output/svg/                       \
  --png=output/png/                       ;


# TODO: also create backs of cards???