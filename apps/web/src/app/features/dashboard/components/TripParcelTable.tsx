import CustomText from "@/components/ui/CustomText";
import type { TableData } from "../../trips/application/TripByIdUseCase";

export function TripParcelTable({
  data,
  onEdit,
  onDelete,
}: {
  data: TableData[];
  onEdit: (t: TableData | null) => void;
  onDelete: (itemId: string) => void;
}) {
  const headerStyle = "pl-4 py-4 font-medium";
  return (
    <div
      style={{ marginTop: 16, overflowX: "auto" }}
      className="bg-white shadow-md rounded-xl"
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr className="text-left border border-b-neutral-200">
            <TableTd className={headerStyle}>Route</TableTd>
            <TableTd className={headerStyle}>Date</TableTd>
            <TableTd className={headerStyle}>Space</TableTd>
            <TableTd className={headerStyle}>Price/kg</TableTd>
            <TableTd className={headerStyle}>Status</TableTd>
            <TableTd className={headerStyle}>Actions</TableTd>
          </tr>
        </thead>
        <tbody>
          {data.map((data) => (
            <tr
              key={data.id}
              className="hover:bg-neutral-100 border border-b-neutral-100 hover:shadow-sm"
            >
              <TableTd>
                <span className="inline-flex gap-2">
                  <TableText
                    text={`${data.originCountry} ${"/"} ${data.originCity} → `}
                  />
                  <TableText
                    text={`${data.destinationCity} ${"/"} ${data.destinationCity}`}
                  />
                </span>
              </TableTd>
              <TableTd>
                <TableText text={data.departDate.slice(0, 10)} />
              </TableTd>
              <TableTd>
                <TableText text={`${data.capacityKg.toString()} ${"kg"}`} />
              </TableTd>
              <TableTd>
                <TableText text={data.pricePerKg.toString()} />
              </TableTd>
              <TableTd>
                <TableText text={data.status} />
              </TableTd>
              <TableTd>
                <div className="flex gap-2">
                  <button
                    className="hover:bg-neutral-300 px-3 rounded-md py-1"
                    onClick={() => onEdit(data)}
                  >
                    Edit
                  </button>
                  <button
                    className="hover:bg-error-100 px-2 rounded-md py-1"
                    onClick={() => onDelete(data.id)}
                    style={{ color: "crimson" }}
                  >
                    Delete
                  </button>
                </div>
              </TableTd>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableTd({
  children,
  className = "pl-4 py-2",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={className}>{children}</td>;
}

function TableText({ text }: { text: string }) {
  return (
    <CustomText textVariant="primary" textSize="sm">
      {text}
    </CustomText>
  );
}
