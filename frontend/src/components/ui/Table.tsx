import type { ReactNode } from "react";

type TableColumn<T> = {
  header: string;
  accessor: keyof T & string;
  render?: (row: T) => ReactNode;
};

type TableProps<T extends Record<string, unknown>> = {
  columns: TableColumn<T>[];
  data: T[];
};

const Table = <T extends Record<string, unknown>>({
  columns,
  data,
}: TableProps<T>) => {
  return (
    <div className="overflow-x-auto border border-gray-200 rounded-md">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.header}
                className="px-4 py-2 text-left font-semibold text-gray-700 uppercase tracking-wide"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {columns.map((col) => (
                <td key={col.header} className="px-4 py-2 text-gray-800">
                  {col.render ? col.render(row) : String(row[col.accessor] ?? "")}
                </td>
              ))}
            </tr>
          ))}
          {!data.length && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-6 text-center text-gray-500"
              >
                Chưa có dữ liệu
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
