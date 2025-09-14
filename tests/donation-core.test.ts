import { describe, it, expect, beforeEach } from "vitest";
import { stringAsciiCV, uintCV } from "@stacks/transactions";

const ERR_NOT_AUTHORIZED = 100;
const ERR_INVALID_CAUSE_ID = 101;
const ERR_INVALID_AMOUNT = 102;
const ERR_CAUSE_NOT_FOUND = 103;
const ERR_DONATION_NOT_FOUND = 104;
const ERR_AUTHORITY_NOT_VERIFIED = 105;
const ERR_INVALID_TITLE = 107;
const ERR_INVALID_DESCRIPTION = 108;
const ERR_INVALID_TARGET = 109;
const ERR_CAUSE_ALREADY_EXISTS = 110;
const ERR_MAX_CAUSES_EXCEEDED = 111;

interface Donation {
  donor: string;
  causeId: number;
  amount: number;
  timestamp: number;
}

interface Cause {
  title: string;
  description: string;
  target: number;
  collected: number;
  organization: string;
  status: boolean;
  timestamp: number;
}

interface DonationUpdate {
  updatedAmount: number;
  updatedTimestamp: number;
  updater: string;
}

interface Result<T> {
  ok: boolean;
  value: T;
}

class DonationCoreMock {
  state: {
    totalDonations: number;
    totalCauses: number;
    maxCauses: number;
    creationFee: number;
    authorityContract: string | null;
    donations: Map<number, Donation>;
    causes: Map<number, Cause>;
    causesByTitle: Map<string, number>;
    donationUpdates: Map<number, DonationUpdate>;
  } = {
    totalDonations: 0,
    totalCauses: 0,
    maxCauses: 1000,
    creationFee: 1000,
    authorityContract: null,
    donations: new Map(),
    causes: new Map(),
    causesByTitle: new Map(),
    donationUpdates: new Map(),
  };
  blockHeight: number = 0;
  caller: string = "ST1TEST";
  authorities: Set<string> = new Set(["ST1TEST"]);
  stxTransfers: Array<{ amount: number; from: string; to: string | null }> = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      totalDonations: 0,
      totalCauses: 0,
      maxCauses: 1000,
      creationFee: 1000,
      authorityContract: null,
      donations: new Map(),
      causes: new Map(),
      causesByTitle: new Map(),
      donationUpdates: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1TEST";
    this.authorities = new Set(["ST1TEST"]);
    this.stxTransfers = [];
  }

  setAuthorityContract(contractPrincipal: string): Result<boolean> {
    if (contractPrincipal === "SP000000000000000000002Q6VF78") return { ok: false, value: false };
    if (this.state.authorityContract !== null) return { ok: false, value: false };
    this.state.authorityContract = contractPrincipal;
    return { ok: true, value: true };
  }

  setCreationFee(newFee: number): Result<boolean> {
    if (!this.state.authorityContract) return { ok: false, value: false };
    this.state.creationFee = newFee;
    return { ok: true, value: true };
  }

  registerCause(title: string, description: string, target: number): Result<number> {
    if (this.state.totalCauses >= this.state.maxCauses) return { ok: false, value: ERR_MAX_CAUSES_EXCEEDED };
    if (!title || title.length > 100) return { ok: false, value: ERR_INVALID_TITLE };
    if (!description || description.length > 500) return { ok: false, value: ERR_INVALID_DESCRIPTION };
    if (target <= 0) return { ok: false, value: ERR_INVALID_TARGET };
    if (this.state.causesByTitle.has(title)) return { ok: false, value: ERR_CAUSE_ALREADY_EXISTS };
    if (!this.state.authorityContract) return { ok: false, value: ERR_AUTHORITY_NOT_VERIFIED };

    this.stxTransfers.push({ amount: this.state.creationFee, from: this.caller, to: this.state.authorityContract });
    const id = this.state.totalCauses;
    this.state.causes.set(id, { title, description, target, collected: 0, organization: this.caller, status: true, timestamp: this.blockHeight });
    this.state.causesByTitle.set(title, id);
    this.state.totalCauses++;
    return { ok: true, value: id };
  }

  registerDonation(causeId: number, amount: number): Result<number> {
    if (amount <= 0) return { ok: false, value: ERR_INVALID_AMOUNT };
    const cause = this.state.causes.get(causeId);
    if (!cause) return { ok: false, value: ERR_CAUSE_NOT_FOUND };

    const id = this.state.totalDonations + 1;
    this.stxTransfers.push({ amount, from: this.caller, to: cause.organization });
    this.state.donations.set(id, { donor: this.caller, causeId, amount, timestamp: this.blockHeight });
    this.state.causes.set(causeId, { ...cause, collected: cause.collected + amount });
    this.state.totalDonations = id;
    return { ok: true, value: id };
  }

  updateDonation(donationId: number, newAmount: number): Result<boolean> {
    if (newAmount <= 0) return { ok: false, value: false };
    const donation = this.state.donations.get(donationId);
    if (!donation) return { ok: false, value: false };
    if (donation.donor !== this.caller) return { ok: false, value: false };
    const cause = this.state.causes.get(donation.causeId);
    if (!cause) return { ok: false, value: false };

    this.state.donations.set(donationId, { ...donation, amount: newAmount, timestamp: this.blockHeight });
    this.state.donationUpdates.set(donationId, { updatedAmount: newAmount, updatedTimestamp: this.blockHeight, updater: this.caller });
    this.state.causes.set(donation.causeId, { ...cause, collected: cause.collected - donation.amount + newAmount });
    return { ok: true, value: true };
  }

  getDonation(donationId: number): Donation | null {
    return this.state.donations.get(donationId) || null;
  }

  getCause(causeId: number): Cause | null {
    return this.state.causes.get(causeId) || null;
  }

  getDonationCount(): Result<number> {
    return { ok: true, value: this.state.totalDonations };
  }

  getCauseCount(): Result<number> {
    return { ok: true, value: this.state.totalCauses };
  }
}

describe("DonationCore", () => {
  let contract: DonationCoreMock;

  beforeEach(() => {
    contract = new DonationCoreMock();
    contract.reset();
  });

  it("registers a cause successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.registerCause("Education Fund", "Support schools", 1000);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(0);
    const cause = contract.getCause(0);
    expect(cause?.title).toBe("Education Fund");
    expect(cause?.description).toBe("Support schools");
    expect(cause?.target).toBe(1000);
    expect(contract.stxTransfers).toEqual([{ amount: 1000, from: "ST1TEST", to: "ST2TEST" }]);
  });

  it("rejects duplicate cause titles", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.registerCause("Education Fund", "Support schools", 1000);
    const result = contract.registerCause("Education Fund", "Different description", 2000);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_CAUSE_ALREADY_EXISTS);
  });

  it("registers a donation successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.registerCause("Education Fund", "Support schools", 1000);
    const result = contract.registerDonation(0, 100);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(1);
    const donation = contract.getDonation(1);
    expect(donation?.donor).toBe("ST1TEST");
    expect(donation?.amount).toBe(100);
    expect(contract.stxTransfers).toContainEqual({ amount: 100, from: "ST1TEST", to: "ST1TEST" });
  });

  it("rejects donation with invalid cause", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.registerDonation(99, 100);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_CAUSE_NOT_FOUND);
  });

  it("updates donation successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.registerCause("Education Fund", "Support schools", 1000);
    contract.registerDonation(0, 100);
    const result = contract.updateDonation(1, 200);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const donation = contract.getDonation(1);
    expect(donation?.amount).toBe(200);
    const cause = contract.getCause(0);
    expect(cause?.collected).toBe(200);
  });

  it("rejects update by non-donor", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.registerCause("Education Fund", "Support schools", 1000);
    contract.registerDonation(0, 100);
    contract.caller = "ST3FAKE";
    const result = contract.updateDonation(1, 200);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });

  it("sets creation fee successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.setCreationFee(2000);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.creationFee).toBe(2000);
  });

  it("returns correct donation and cause counts", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.registerCause("Education Fund", "Support schools", 1000);
    contract.registerDonation(0, 100);
    contract.registerDonation(0, 200);
    expect(contract.getDonationCount().value).toBe(2);
    expect(contract.getCauseCount().value).toBe(1);
  });
})