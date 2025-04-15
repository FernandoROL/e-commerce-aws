enum PaymentType {
  CASH = "CASH",
  DEBIT_CARD = "DEBIT_CARD",
  CREDIT_CARD = "CREDIT_CARD",
}

enum ShippingType {
  ECONOMIC = "ECONOMIC",
  URGENT = "URGENT",
}

enum CarrierType {
  CORREIOS = "CORREIOS",
  FEDEX = "FEDEX",
}

interface OrderRequest {
  email: string;
  productIds: string[];
  payment: PaymentType;
  shipping: {
    type: ShippingType;
    carrier: CarrierType;
  };
}

interface OrderProduct {
  code: string;
  price: number;
}

interface OrderResponse {
  email: string;
  id: string;
  createdAt: number;
  billing: {
    payment: PaymentType;
    totalPrice: number;
  };
  shipping: {
    type: ShippingType;
    carrier: CarrierType;
  };
  products: OrderProduct[];
}

export { PaymentType, ShippingType, CarrierType, OrderRequest, OrderProduct, OrderResponse };
