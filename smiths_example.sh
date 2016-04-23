# Example usage of converter.js

# Card fronts
node js/converter.js                            \
  -v                                            \
  --overwrite                                   \
  --template=input/templates/template_front.svg \
  --csv=input/data/smiths_example.csv           \
  --imgs=input/images/smiths/                   \
  --svg=output/smiths/svg/                      \
  --png=output/smiths/png/                      \
  --suffix=_front                               ;

# Card backs (photo only)
node js/converter.js                            \
  -v                                            \
  --overwrite                                   \
  --template=input/templates/template_back.svg  \
  --csv=input/data/smiths_example.csv           \
  --imgs=input/images/smiths/                   \
  --svg=output/smiths/svg/                      \
  --png=output/smiths/png/                      \
  --suffix=_back                                ;
