export type WorkStackParams = {
  Clients: undefined;
  Projects: { clientId: number; clientName: string };
  TimeHistory: { projectId: number; projectName: string };
};

export type MoneyStackParams = {
  MoneyList: undefined;
  InvoiceDetail: { invoiceId: number };
};
