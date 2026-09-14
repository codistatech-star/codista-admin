export function AdminEmptyRow({
  colSpan,
  message,
}: {
  colSpan: number;
  message: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="admin-empty-row">
        {message}
      </td>
    </tr>
  );
}
