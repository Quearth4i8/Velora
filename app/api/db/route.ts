import { NextRequest, NextResponse } from 'next/server';
import { postgres } from '@/db/postgres';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');
    
    if (!table) {
      return NextResponse.json({ error: 'Table required' }, { status: 400 });
    }

    const select = searchParams.get('select') || '*';
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const order = searchParams.get('order');
    const single = searchParams.get('single') === 'true';
    
    let builder = postgres.from(table).select(select);
    
    // Handle eq, neq, gte, lte, and in filters
    for (const [key, value] of searchParams.entries()) {
      if (key.startsWith('eq.')) {
        const column = key.slice(3);
        builder = builder.eq(column, value);
      } else if (key.startsWith('neq.')) {
        const column = key.slice(4);
        builder = builder.neq(column, value);
      } else if (key.startsWith('gte.')) {
        const column = key.slice(4);
        builder = builder.gte(column, value);
      } else if (key.startsWith('lte.')) {
        const column = key.slice(4);
        builder = builder.lte(column, value);
      } else if (key.startsWith('in.')) {
        const column = key.slice(3);
        const values = value.split(',');
        builder = builder.in(column, values);
      }
    }
    
    if (order) {
      const ascending = !order.endsWith('.desc');
      const column = order.replace(/\.asc$|\.desc$/, '');
      builder = builder.order(column, { ascending });
    }
    
    if (limit) {
      builder = builder.limit(parseInt(limit));
    }
    
    if (offset) {
      builder = builder.offset(parseInt(offset));
    }
    
    const result = await builder;
    
    if (single) {
      return NextResponse.json({ data: result.data?.[0] || null, error: result.error });
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { table, data, returning } = body;
    
    if (!table || !data) {
      return NextResponse.json({ error: 'Table and data required' }, { status: 400 });
    }
    
    const result = await postgres.from(table).insert(data, { returning });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { table, data, where } = body;
    
    if (!table || !data || !where) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    
    const result = await postgres.from(table).update(data).eq(where.column, where.value);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { table, where, count, match } = body;
    
    if (!table || !where) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    
    // Support match with multiple conditions
    if (match && Array.isArray(where.column) && Array.isArray(where.value)) {
      const conditions: Record<string, any> = {};
      where.column.forEach((col: string, i: number) => {
        conditions[col] = where.value[i];
      });
      const result = await postgres.from(table).delete(count ? { count } : undefined).match(conditions);
      return NextResponse.json(result);
    }
    
    // Single condition (eq)
    const result = await postgres.from(table).delete(count ? { count } : undefined).eq(where.column, where.value);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
