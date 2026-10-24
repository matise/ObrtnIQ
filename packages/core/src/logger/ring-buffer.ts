/**
 * Cirkularni Ring Buffer za zadržavanje fiksne količine najnovijih zapisa u memoriji
 */
export class RingBuffer<T> {
  private buffer: (T | undefined)[];
  private head: number = 0;
  private tail: number = 0;
  private count: number = 0;
  readonly capacity: number;

  constructor(capacity: number = 500) {
    if (capacity <= 0) {
      throw new Error('RingBuffer kapacitet mora biti veći od 0.');
    }
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  /**
   * Dodaje novi element na kraj buffera. Ako je pun, prepisuje najstariji element.
   */
  push(item: T): void {
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;

    if (this.count < this.capacity) {
      this.count++;
    } else {
      // Buffer je pun, pomičemo i head pokazivač
      this.head = (this.head + 1) % this.capacity;
    }
  }

  /**
   * Vraća sve elemente kronološki poredane od najstarijeg prema najnovijem.
   */
  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.count; i++) {
      const idx = (this.head + i) % this.capacity;
      const item = this.buffer[idx];
      if (item !== undefined) {
        result.push(item);
      }
    }
    return result;
  }

  /**
   * Trenutni broj elemenata u bufferu.
   */
  get size(): number {
    return this.count;
  }

  /**
   * Briše sve elemente iz buffera.
   */
  clear(): void {
    this.buffer = new Array(this.capacity);
    this.head = 0;
    this.tail = 0;
    this.count = 0;
  }
}
