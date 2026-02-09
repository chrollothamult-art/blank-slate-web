import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface TradeItem {
  item_id: string;
  item_name: string;
  quantity: number;
  icon_emoji?: string;
}

export interface TradeOffer {
  id: string;
  session_id: string;
  from_character_id: string;
  to_character_id: string;
  offered_items: TradeItem[];
  requested_items: TradeItem[];
  status: "pending" | "accepted" | "rejected" | "cancelled";
  message: string | null;
  created_at: string;
  responded_at: string | null;
}

export const useItemTrading = (sessionId?: string, myCharacterId?: string) => {
  const [tradeOffers, setTradeOffers] = useState<TradeOffer[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTradeOffers = useCallback(async () => {
    if (!sessionId || !myCharacterId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("rp_trade_offers")
      .select("*")
      .eq("session_id", sessionId)
      .or(`from_character_id.eq.${myCharacterId},to_character_id.eq.${myCharacterId}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching trade offers:", error);
    } else {
      setTradeOffers(
        (data || []).map((d) => ({
          ...d,
          offered_items: (d.offered_items as unknown as TradeItem[]) || [],
          requested_items: (d.requested_items as unknown as TradeItem[]) || [],
          status: d.status as TradeOffer["status"],
        }))
      );
    }
    setLoading(false);
  }, [sessionId, myCharacterId]);

  useEffect(() => {
    fetchTradeOffers();
  }, [fetchTradeOffers]);

  const createTradeOffer = async (
    toCharacterId: string,
    offeredItems: TradeItem[],
    requestedItems: TradeItem[],
    message?: string
  ): Promise<boolean> => {
    if (!sessionId || !myCharacterId) return false;

    const { error } = await supabase.from("rp_trade_offers").insert({
      session_id: sessionId,
      from_character_id: myCharacterId,
      to_character_id: toCharacterId,
      offered_items: JSON.parse(JSON.stringify(offeredItems)),
      requested_items: JSON.parse(JSON.stringify(requestedItems)),
      message: message || null,
    });

    if (error) {
      toast({ title: "Failed to send trade offer", variant: "destructive" });
      return false;
    }

    toast({ title: "🤝 Trade offer sent!" });
    await fetchTradeOffers();
    return true;
  };

  const respondToTrade = async (
    tradeId: string,
    accept: boolean
  ): Promise<boolean> => {
    if (!myCharacterId) return false;

    const trade = tradeOffers.find((t) => t.id === tradeId);
    if (!trade) return false;

    if (accept) {
      // Transfer offered items: remove from sender, add to receiver
      for (const item of trade.offered_items) {
        // Remove from sender
        const { data: senderInv } = await supabase
          .from("rp_character_inventory")
          .select("id, quantity")
          .eq("character_id", trade.from_character_id)
          .eq("item_id", item.item_id)
          .single();

        if (senderInv) {
          if (senderInv.quantity <= item.quantity) {
            await supabase.from("rp_character_inventory").delete().eq("id", senderInv.id);
          } else {
            await supabase
              .from("rp_character_inventory")
              .update({ quantity: senderInv.quantity - item.quantity })
              .eq("id", senderInv.id);
          }
        }

        // Add to receiver
        const { data: receiverInv } = await supabase
          .from("rp_character_inventory")
          .select("id, quantity")
          .eq("character_id", trade.to_character_id)
          .eq("item_id", item.item_id)
          .single();

        if (receiverInv) {
          await supabase
            .from("rp_character_inventory")
            .update({ quantity: receiverInv.quantity + item.quantity })
            .eq("id", receiverInv.id);
        } else {
          await supabase.from("rp_character_inventory").insert({
            character_id: trade.to_character_id,
            item_id: item.item_id,
            quantity: item.quantity,
            source_session_id: sessionId,
          });
        }
      }

      // Transfer requested items: remove from receiver, add to sender
      for (const item of trade.requested_items) {
        const { data: receiverInv } = await supabase
          .from("rp_character_inventory")
          .select("id, quantity")
          .eq("character_id", trade.to_character_id)
          .eq("item_id", item.item_id)
          .single();

        if (receiverInv) {
          if (receiverInv.quantity <= item.quantity) {
            await supabase.from("rp_character_inventory").delete().eq("id", receiverInv.id);
          } else {
            await supabase
              .from("rp_character_inventory")
              .update({ quantity: receiverInv.quantity - item.quantity })
              .eq("id", receiverInv.id);
          }
        }

        const { data: senderInv } = await supabase
          .from("rp_character_inventory")
          .select("id, quantity")
          .eq("character_id", trade.from_character_id)
          .eq("item_id", item.item_id)
          .single();

        if (senderInv) {
          await supabase
            .from("rp_character_inventory")
            .update({ quantity: senderInv.quantity + item.quantity })
            .eq("id", senderInv.id);
        } else {
          await supabase.from("rp_character_inventory").insert({
            character_id: trade.from_character_id,
            item_id: item.item_id,
            quantity: item.quantity,
            source_session_id: sessionId,
          });
        }
      }
    }

    // Update trade status
    const { error } = await supabase
      .from("rp_trade_offers")
      .update({
        status: accept ? "accepted" : "rejected",
        responded_at: new Date().toISOString(),
      })
      .eq("id", tradeId);

    if (error) {
      toast({ title: "Failed to respond to trade", variant: "destructive" });
      return false;
    }

    toast({
      title: accept ? "🤝 Trade accepted!" : "Trade declined",
      description: accept ? "Items have been exchanged." : undefined,
    });
    await fetchTradeOffers();
    return true;
  };

  const cancelTrade = async (tradeId: string): Promise<boolean> => {
    const { error } = await supabase
      .from("rp_trade_offers")
      .update({ status: "cancelled", responded_at: new Date().toISOString() })
      .eq("id", tradeId);

    if (error) {
      toast({ title: "Failed to cancel trade", variant: "destructive" });
      return false;
    }

    toast({ title: "Trade cancelled" });
    await fetchTradeOffers();
    return true;
  };

  const pendingIncoming = tradeOffers.filter(
    (t) => t.to_character_id === myCharacterId && t.status === "pending"
  );

  const pendingOutgoing = tradeOffers.filter(
    (t) => t.from_character_id === myCharacterId && t.status === "pending"
  );

  return {
    tradeOffers,
    pendingIncoming,
    pendingOutgoing,
    loading,
    createTradeOffer,
    respondToTrade,
    cancelTrade,
    refetch: fetchTradeOffers,
  };
};
