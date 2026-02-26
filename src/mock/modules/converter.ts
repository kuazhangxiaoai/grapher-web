import { storeToRefs } from "pinia";
import { ref } from "vue";
import { GraphTypeInteger } from "../../configs/graph";

export function useConverter() {
  const graphTypeString2Integer = (type: string) => {
    switch (type) {
      case "text":
        return GraphTypeInteger.Text;
        break;
      case "database":
        return GraphTypeInteger.Database;
      case "any":
        return GraphTypeInteger.Free;
      default:
        return -1;
    }
  };
  return {
    graphTypeString2Integer,
  };
}
