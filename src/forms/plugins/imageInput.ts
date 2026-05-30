import type { FieldPlugin, FieldPluginHost } from "formlayer";


export default class ImageInput implements FieldPlugin {
    init(fieldWrapper: HTMLElement, host: FieldPluginHost): void{

    }
    destroy(): void{
        return;
    }
}