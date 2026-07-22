export class InlineKeyboardBuilder {
  private rows: any[][] = [];
  addButton(text: string, data: string) { return this; }
  addRow() { return this; }
  build() { return { inline_keyboard: this.rows }; }
}
