export class Memento {
  constructor(private readonly estado: string) {}

  getEstado(): string {
    return this.estado;
  }
}
