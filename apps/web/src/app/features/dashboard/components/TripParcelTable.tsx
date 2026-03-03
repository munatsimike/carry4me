import type { TableData } from "../../trips/application/TripByIDUseCase";

export function TripParcelTable({
  data,
  onEdit,
  onDelete,
}: {
  data: TableData[];
  onEdit: (t: TableData | null) => void;
  onDelete: (itemId: string) => void;
}) {
  return (
    <div style={{ marginTop: 16, overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left" }}>
            <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>
              Route
            </th>
            <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>
              Date
            </th>
            <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>
              Space
            </th>
            <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>
              Price/kg
            </th>
            <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>
              Status
            </th>
            <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((data) => (
            <tr key={data.id} className="hover:bg-neutral-100">
              <td style={{ padding: 12, borderBottom: "1px solid #f3f3f3" }}>
                {data.originCountry} / {data.originCity} →{" "}
                {data.destinationCity} / {data.destinationCity}
              </td>
              <td style={{ padding: 12, borderBottom: "1px solid #f3f3f3" }}>
                {String(data.departDate).slice(0, 10)}
              </td>
              <td style={{ padding: 12, borderBottom: "1px solid #f3f3f3" }}>
                {data.capacityKg} kg
              </td>
              <td style={{ padding: 12, borderBottom: "1px solid #f3f3f3" }}>
                {data.pricePerKg}
              </td>
              <td style={{ padding: 12, borderBottom: "1px solid #f3f3f3" }}>
                {data.status}
              </td>
              <td style={{ padding: 12, borderBottom: "1px solid #f3f3f3" }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => onEdit(data)}>Edit</button>
                  <button
                    onClick={() => onDelete(data.id)}
                    style={{ color: "crimson" }}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
