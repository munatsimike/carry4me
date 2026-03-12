import {
  CheckCircle2,
  XCircle,
  CreditCard,
  PackageCheck,
  Package,
  BadgeDollarSign,
  Bell,
  Hourglass,
} from "lucide-react";

export function iconForActivity(type: string) {
  const width = 1.5;

  switch (type) {
    case "REQUEST_ACCEPTED":
      return (
        <CheckCircle2 className="h-5 w-5 text-green-500" strokeWidth={width} />
      );

    case "REQUEST_REJECTED":
    case "REQUEST_CANCELED":
      return <XCircle className="h-5 w-5 text-red-500" strokeWidth={width} />;

    case "PAYMENT_COMPLETED":
      return (
        <CreditCard className="h-5 w-5 text-blue-500" strokeWidth={width} />
      );

    case "PARCEL_RECEIVED":
      return (
        <Package className="h-5 w-5 text-indigo-500" strokeWidth={width} />
      );

    case "PARCEL_DELIVERED":
      return (
        <PackageCheck
          className="h-5 w-5 text-emerald-500"
          strokeWidth={width}
        />
      );

    case "PAYMENT_RELEASED":
      return (
        <BadgeDollarSign
          className="h-5 w-5 text-amber-500"
          strokeWidth={width}
        />
      );

       case "REQUEST_EXPIRED":
      return (
        <Hourglass   
          className="h-5 w-5 text-amber-500"
          strokeWidth={width}
        />
      );

    default:
      return <Bell className="h-5 w-5 text-neutral-400" strokeWidth={width} />;
  }
}
