/**
 * Fixed-capacity min-heap used to keep the top-K highest-scoring documents while
 * scanning postings, without sorting the full candidate set — O(n log k) instead
 * of O(n log n).
 *
 * Ordering is a total order: higher score wins, ties broken by lower doc id. The
 * heap root is always the current "worst" of the retained K, so results are
 * deterministic regardless of insertion order.
 */
export interface Scored {
  doc: number;
  score: number;
}

/** True when `a` should rank ahead of `b`. */
function ranksAhead(a: Scored, b: Scored): boolean {
  return a.score > b.score || (a.score === b.score && a.doc < b.doc);
}

export class TopKHeap {
  private readonly heap: Scored[] = [];

  constructor(private readonly capacity: number) {
    if (capacity < 1) throw new Error('TopKHeap capacity must be >= 1');
  }

  /** Offer a candidate; kept only if it outranks the current weakest of the top-K. */
  push(doc: number, score: number): void {
    const item = { doc, score };
    if (this.heap.length < this.capacity) {
      this.heap.push(item);
      this.bubbleUp(this.heap.length - 1);
    } else if (ranksAhead(item, this.heap[0]!)) {
      this.heap[0] = item;
      this.bubbleDown(0);
    }
  }

  /** Everything retained, best first. */
  toSorted(): Scored[] {
    return [...this.heap].sort((a, b) => (ranksAhead(a, b) ? -1 : 1));
  }

  get size(): number {
    return this.heap.length;
  }

  /** The heap invariant: parent is weaker than (or equal to) its children. */
  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (ranksAhead(this.heap[parent]!, this.heap[i]!)) this.swap(i, parent);
      else break;
      i = parent;
    }
  }

  private bubbleDown(i: number): void {
    const n = this.heap.length;
    for (;;) {
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      let weakest = i;
      if (left < n && ranksAhead(this.heap[weakest]!, this.heap[left]!)) weakest = left;
      if (right < n && ranksAhead(this.heap[weakest]!, this.heap[right]!)) weakest = right;
      if (weakest === i) break;
      this.swap(i, weakest);
      i = weakest;
    }
  }

  private swap(a: number, b: number): void {
    const tmp = this.heap[a]!;
    this.heap[a] = this.heap[b]!;
    this.heap[b] = tmp;
  }
}
