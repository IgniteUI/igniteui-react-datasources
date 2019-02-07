import { fromEnum } from "igniteui-core/type";

export function toArray<T>(en: any): T[] {
    return Array.from(fromEnum(en)) as T[];
}

export function first<T>(iter: Iterable<T>): T {
    for (let v of iter) {
        return v;
    }
    throw new Error("Iterable contained no elements, expected at least one");
}

export class LinkedList<T>
{
    private _first: LinkedListNode<T>;
    public get first(): LinkedListNode<T> {
        return this._first;
    }

    private _last: LinkedListNode<T>;
    public get last(): LinkedListNode<T> {
        return this._last;
    }

    public addFirst(item: T): void
    {
        if (this._first == null)
        {
            this._first = new LinkedListNode<T>(item);
            this._last = this._first;
        }
        else
        {
            var oldFirst = this._first;
            this._first = new LinkedListNode<T>(item);
            this._first.next = oldFirst;
            oldFirst.prev = this._first;
        }
    }

    public addLast(item: T): void
    {
        if (this._last == null)
        {
            this._first = new LinkedListNode<T>(item);
            this._last = this._first;
        }
        else
        {
            var oldLast = this._last;
            this._last = new LinkedListNode<T>(item);
            this._last.prev = oldLast;
            oldLast.next = this._last;
        }
    }

    public removeFirst(): void
    {
        this.remove(this.first);
    }

    public clear(): void
    {
        this._first = null;
        this._last = null;
    }

    public contains(value: T): boolean {
        let curr = this.first;
        while (curr != null) {
            if (curr.value === value) {
                return true;
            }
            curr = curr.next;
        }

        return false;
    } 

    public removeValue(value: T): void {
        let curr = this.first;
        while (curr != null) {
            if (curr.value === value) {
                this.remove(curr);
                return;
            }
            curr = curr.next;
        }
    } 

    public remove(node: LinkedListNode<T>): void
    {
        if (this._first == node)
        {
            this._first = node.next;
            if (node.next != null)
            {
                node.next.prev = null;
            }
        }
        
        if (this._last == node)
        {
            this._last = node.prev;
            if (node.prev != null)
            {
                node.prev.next = null;
            }
        }
        
        if (node.prev != null)
        {
            node.prev.next = node.next;
        }
        if (node.next != null)
        {
            node.next.prev = node.prev;
        }

        node.next = null;
        node.prev = null;
    }
}

export class LinkedListNode<T>
{
    private _value: T;
    public get value(): T {
        return this._value;
    }
    public set value(value: T) {
        this._value = value;
    }

    private _prev: LinkedListNode<T>;
    public get prev(): LinkedListNode<T> {
        return this._prev;
    }
    public set prev(value: LinkedListNode<T>) {
        this._prev = value;
    }

    private _next: LinkedListNode<T>;
    public get next(): LinkedListNode<T> {
        return this._next;
    }
    public set next(value: LinkedListNode<T>) {
        this._next = value;
    }
    
    public constructor(item?: T)
    {
        if (item !== undefined) {
            this.value = item;
        }
    }
}