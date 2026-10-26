<script setup lang="ts">
import { findMaterial, findRal } from '../../catalog/catalog'
import type { PanelType } from '../../core/types'
import { tl } from '../../site/cart'
import type { Configurator } from '../../useConfigurator'

const props = defineProps<{ cfg: Configurator }>()
const { cuts, price, catalog } = props.cfg

const typeLabel: Record<PanelType, string> = {
  side: 'Yan',
  divider: 'Ara dikme',
  top: 'Tabla',
  bottom: 'Alt tabla',
  shelf: 'Raf',
  plinth: 'Baza',
  back: 'Arkalık',
  door: 'Kapak',
  glass: 'Cam',
  drawerFront: 'Çekmece önü',
  handle: 'Kulp',
  leg: 'Ayak',
  apron: 'Etek',
  modesty: 'Ön etek',
  rail: 'Yan kayıt',
  headboard: 'Başlık / uç',
  slat: 'Lata',
  cushion: 'Minder',
  mirror: 'Ayna',
  rod: 'Askı borusu',
  panel: 'Panel',
  light: 'LED şerit',
  lock: 'Kilit',
  innerDrawer: 'İç çekmece önü',
  drawerBox: 'Çekmece kutusu',
}

const num = (n: number) => n.toLocaleString('tr-TR', { maximumFractionDigits: 1 })
const materialName = (id: number, color: string | null) => [findMaterial(catalog, id)?.name, findRal(color)?.code].filter(Boolean).join(' · ')
</script>

<template>
  <div class="stack">
    <div>
      <b>Kesim listesi</b>
      <p class="muted small">Her parça bu ölçülerde CNC ile kesilir ve kenar bantlanır.</p>
    </div>
    <table class="table">
      <thead>
        <tr>
          <th>Parça</th>
          <th>Ölçü (mm)</th>
          <th>Malzeme</th>
          <th>Adet</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(c, i) in cuts" :key="i">
          <td>{{ typeLabel[c.type] }}</td>
          <td class="num">{{ num(c.width) }} × {{ num(c.height) }} × {{ c.thickness }}</td>
          <td>{{ materialName(c.material, c.color) }}</td>
          <td class="num">{{ c.count }}</td>
        </tr>
      </tbody>
    </table>

    <b>Fiyat dökümü</b>
    <table class="table">
      <tbody>
        <tr v-for="(l, i) in price.lines" :key="i">
          <td>{{ l.label }}</td>
          <td class="num">{{ num(l.quantity) }} {{ l.unit }}</td>
          <td class="num">{{ tl(Math.round(l.amount)) }}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2"><b>Toplam (KDV ve kargo dahil)</b></td>
          <td class="num"><b>{{ tl(price.total) }}</b></td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<style scoped>
.small {
  margin: 2px 0 0;
  font-size: 12px;
}
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}
.table th,
.table td {
  padding: 6px 4px;
  border-bottom: 1px solid var(--line);
  text-align: left;
}
.table th {
  color: var(--muted);
  font-weight: 500;
}
.num {
  text-align: right !important;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
</style>
