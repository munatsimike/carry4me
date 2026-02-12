import {
  CheckCircle2,
  XCircle,
  CreditCard,
  PackageCheck,
  Package,
  BadgeDollarSign,
  Bell,
} from "lucide-react";

export function iconForActivity(type: string) {
  const cls = "h-5 w-5 text-neutral-300";
  const width = 1.5;
  switch (type) {
    case "REQUEST_ACCEPTED":
      return <CheckCircle2 className={cls} strokeWidth={width}/>;
    case "REQUEST_REJECTED":
    case "REQUEST_CANCELED":
      return <XCircle className={cls} strokeWidth={width} />;
    case "PAYMENT_COMPLETED":
      return <CreditCard className={cls} strokeWidth={width} />;
    case "PARCEL_RECEIVED":
      return <Package className={cls} strokeWidth={width} />;
    case "PARCEL_DELIVERED":
      return <PackageCheck className={cls} strokeWidth={width} />;
    case "PAYMENT_RELEASED":
      return <BadgeDollarSign className={cls} strokeWidth={width} />;
    default:
      return <Bell className={cls} strokeWidth={width} />;
  }
}
