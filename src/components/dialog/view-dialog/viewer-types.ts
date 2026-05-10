import {
  BooleanViewer,
  CustomViewer,
  DateViewer,
  ImageViewer,
  ListViewer,
  MapViewer,
  MultiLanguageViewer,
  NumberViewer,
  ObjectViewer,
  StringTitleViewer,
  StringViewer,
} from "./viewers/defaults";

const types = {
  string: StringViewer,
  stringTitle: StringTitleViewer,
  number: NumberViewer,
  date: DateViewer,
  boolean: BooleanViewer,
  list: ListViewer,
  image: ImageViewer,
  object: ObjectViewer,
  map: MapViewer,
  custom: CustomViewer,
  "multi-language": MultiLanguageViewer,
};

export default types;
